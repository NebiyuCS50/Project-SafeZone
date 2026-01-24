const { ReportDatabase } = require('../services/firestore.js');

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



    describe('getValidationStats', () => {
        test('should calculate validation statistics', async () => {
            // Setup
            const mockSnapshot = {
                forEach: jest.fn((callback) => {
                    // Simulate 5 documents with different statuses and scores
                    const docs = [
                        { data: () => ({ status: 'pending_admin_review', qualityScore: 80 }) },
                        { data: () => ({ status: 'pending_admin_review', qualityScore: 60 }) },
                        { data: () => ({ status: 'pending_admin_review', qualityScore: undefined }) },
                        { data: () => ({ status: 'reviewed', qualityScore: 75 }) },
                        { data: () => ({ status: 'reviewed', qualityScore: 65 }) }
                    ];
                    docs.forEach(callback);
                })
            };

            mockCollection.get.mockResolvedValue(mockSnapshot);

            // Execute
            const stats = await database.getValidationStats();

            // Verify
            expect(stats.totalReports).toBe(5);
            expect(stats.pendingReview).toBe(3);
            expect(stats.reviewedReports).toBe(2);
            expect(stats.averageScore).toBe(70); // (80+60)/2
            expect(stats.qualityDistribution).toEqual({
                high: 1, // >= 80
                medium: 1, // 60-79
                low: 0 // < 60
            });
        });
    });
});