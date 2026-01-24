import { ReportDatabase } from '../services/firestore.js';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    firestore: {
        FieldValue: {
            serverTimestamp: jest.fn(() => 'mock-timestamp')
        }
    },
    apps: []
}));

const admin = require('firebase-admin');

describe('ReportDatabase', () => {
    let database;
    let mockCollection;
    let mockDoc;
    let mockDocRef;

    const testReportId = 'test-report-123';
    const testReportData = {
        incidentType: 'accident',
        description: 'Test accident',
        status: 'pending'
    };

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create mock Firestore structure
        mockDoc = {
            id: testReportId,
            data: jest.fn(),
            get: jest.fn()
        };

        mockDocRef = {
            get: jest.fn(),
            set: jest.fn(),
            update: jest.fn()
        };

        mockCollection = {
            doc: jest.fn(() => mockDocRef)
        };

        const mockFirestore = {
            collection: jest.fn(() => mockCollection)
        };

        // Mock the firestore getter
        admin.firestore.mockReturnValue(mockFirestore);

        database = new ReportDatabase(mockFirestore);
    });

    describe('getReport', () => {
        test('should return report data when document exists', async () => {
            // Setup
            mockDocRef.get.mockResolvedValue({
                exists: true,
                id: testReportId,
                data: () => ({
                    ...testReportData,
                    createdAt: { toDate: () => new Date('2024-01-01') }
                })
            });

            // Execute
            const result = await database.getReport(testReportId);

            // Verify
            expect(result).toEqual({
                id: testReportId,
                ...testReportData,
                createdAt: new Date('2024-01-01'),
                updatedAt: undefined
            });
            expect(mockCollection.doc).toHaveBeenCalledWith(testReportId);
        });

        test('should return null when document does not exist', async () => {
            // Setup
            mockDocRef.get.mockResolvedValue({
                exists: false
            });

            // Execute
            const result = await database.getReport(testReportId);

            // Verify
            expect(result).toBeNull();
        });

        test('should handle database errors', async () => {
            // Setup
            mockDocRef.get.mockRejectedValue(new Error('Database error'));

            // Execute & Verify
            await expect(database.getReport(testReportId))
                .rejects.toThrow('Failed to fetch report: Database error');
        });
    });

    describe('saveReport', () => {
        test('should save report with merge option', async () => {
            // Setup
            mockDocRef.set.mockResolvedValue();

            // Execute
            const result = await database.saveReport(testReportId, testReportData, true);

            // Verify
            expect(result).toBe(testReportId);
            expect(mockDocRef.set).toHaveBeenCalledWith(
                {
                    ...testReportData,
                    updatedAt: 'mock-timestamp'
                },
                { merge: true }
            );
        });

        test('should save report without merge option', async () => {
            // Setup
            mockDocRef.set.mockResolvedValue();

            // Execute
            await database.saveReport(testReportId, testReportData, false);

            // Verify
            expect(mockDocRef.set).toHaveBeenCalledWith(
                {
                    ...testReportData,
                    updatedAt: 'mock-timestamp',
                    createdAt: 'mock-timestamp'
                },
                { merge: false }
            );
        });
    });

    describe('addValidationAttempt', () => {
        test('should add validation attempt to history', async () => {
            // Setup
            const existingHistory = [
                { attemptNumber: 1, score: 60, timestamp: 'time1' }
            ];

            mockDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({
                    validationHistory: existingHistory
                })
            });
            mockDocRef.update.mockResolvedValue();

            const validationResult = {
                score: 75,
                reason: 'Improved report'
            };

            // Execute
            const result = await database.addValidationAttempt(testReportId, validationResult);

            // Verify
            expect(result.attemptNumber).toBe(2);
            expect(result.score).toBe(75);
            expect(mockDocRef.update).toHaveBeenCalledWith({
                validationHistory: expect.arrayContaining([
                    ...existingHistory,
                    expect.objectContaining({
                        attemptNumber: 2,
                        score: 75,
                        reason: 'Improved report'
                    })
                ]),
                lastValidationAttempt: expect.any(Object)
            });
        });

        test('should handle reports with no existing history', async () => {
            // Setup
            mockDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({}) // No validationHistory
            });
            mockDocRef.update.mockResolvedValue();

            const validationResult = {
                score: 80,
                reason: 'Good report'
            };

            // Execute
            const result = await database.addValidationAttempt(testReportId, validationResult);

            // Verify
            expect(result.attemptNumber).toBe(1);
        });
    });

    describe('forwardToAdminReview', () => {
        test('should move report to incidents collection', async () => {
            // Setup
            const reportData = {
                ...testReportData,
                id: testReportId
            };

            mockDocRef.get.mockResolvedValue({
                exists: true,
                data: () => reportData
            });

            const mockIncidentsDocRef = {
                set: jest.fn().mockResolvedValue()
            };
            const mockIncidentsCollection = {
                doc: jest.fn(() => mockIncidentsDocRef)
            };

            // Mock the incidents collection call
            const mockFirestore = admin.firestore();
            mockFirestore.collection.mockImplementation((name) => {
                if (name === 'incidents') return mockIncidentsCollection;
                return mockCollection;
            });

            // Execute
            const result = await database.forwardToAdminReview(testReportId);

            // Verify
            expect(result).toBe(testReportId);
            expect(mockIncidentsDocRef.set).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...reportData,
                    status: 'pending_admin_review',
                    source: 'ai_validation_rejected'
                })
            );
        });

        test('should throw error for non-existent report', async () => {
            // Setup
            mockDocRef.get.mockResolvedValue({
                exists: false
            });

            // Execute & Verify
            await expect(database.forwardToAdminReview(testReportId))
                .rejects.toThrow(`Report ${testReportId} not found`);
        });
    });

    describe('getValidationStats', () => {
        test('should calculate validation statistics', async () => {
            // Setup
            const mockSnapshot = {
                forEach: jest.fn((callback) => {
                    // Simulate 5 documents with different statuses
                    const docs = [
                        { data: () => ({ status: 'accepted' }) },
                        { data: () => ({ status: 'accepted' }) },
                        { data: () => ({ status: 'rejected' }) },
                        { data: () => ({ status: 'forwarded_to_admin' }) },
                        { data: () => ({ status: 'pending' }) }
                    ];
                    docs.forEach(callback);
                })
            };

            mockCollection.get.mockResolvedValue(mockSnapshot);

            // Execute
            const stats = await database.getValidationStats();

            // Verify
            expect(stats.totalReports).toBe(5);
            expect(stats.acceptedReports).toBe(2);
            expect(stats.rejectedReports).toBe(1);
            expect(stats.forwardedReports).toBe(1);
            expect(stats.acceptanceRate).toBe(40); // 2/5 * 100
        });
    });
});