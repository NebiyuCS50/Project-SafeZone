import admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}

export const db = admin.firestore();

/**
 * Database Service
 * Abstracts all database operations for report management
 */
export class ReportDatabase {
    constructor(firestoreClient = db) {
        this.db = firestoreClient;
        this.collection = 'reports';
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Gets a report by ID
     * @param {string} reportId - The report ID
     * @returns {Promise<Object|null>} Report data or null if not found
     */
    async getReport(reportId) {
        try {
            const docRef = this.db.collection(this.collection).doc(reportId);
            const doc = await docRef.get();

            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
            };
        } catch (error) {
            console.error(`Error fetching report ${reportId}:`, error);
            throw new Error(`Failed to fetch report: ${error.message}`);
        }
    }

    /**
     * Creates or updates a report
     * @param {string} reportId - The report ID
     * @param {Object} reportData - The report data
     * @param {boolean} merge - Whether to merge with existing data
     */
    async saveReport(reportId, reportData, merge = true) {
        try {
            const docRef = this.db.collection(this.collection).doc(reportId);
            const data = {
                ...reportData,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (!merge) {
                data.createdAt = admin.firestore.FieldValue.serverTimestamp();
            }

            await docRef.set(data, { merge });
            return reportId;
        } catch (error) {
            console.error(`Error saving report ${reportId}:`, error);
            throw new Error(`Failed to save report: ${error.message}`);
        }
    }

    /**
     * Updates specific fields of a report
     * @param {string} reportId - The report ID
     * @param {Object} updates - Fields to update
     */
    async updateReport(reportId, updates) {
        try {
            const docRef = this.db.collection(this.collection).doc(reportId);
            await docRef.update({
                ...updates,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return reportId;
        } catch (error) {
            console.error(`Error updating report ${reportId}:`, error);
            throw new Error(`Failed to update report: ${error.message}`);
        }
    }

    /**
     * Gets report validation history
     * @param {string} reportId - The report ID
     * @returns {Promise<Array>} Array of validation attempts
     */
    async getValidationHistory(reportId) {
        try {
            const docRef = this.db.collection(this.collection).doc(reportId);
            const doc = await docRef.get();

            if (!doc.exists) {
                return [];
            }

            const data = doc.data();
            return data.validationHistory || [];
        } catch (error) {
            console.error(`Error fetching validation history for ${reportId}:`, error);
            return [];
        }
    }

    /**
     * Adds a validation attempt to the report history
     * @param {string} reportId - The report ID
     * @param {Object} validationResult - The validation result
     */
    async addValidationAttempt(reportId, validationResult) {
        try {
            const history = await this.getValidationHistory(reportId);
            const attempt = {
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                attemptNumber: history.length + 1,
                ...validationResult
            };

            history.push(attempt);

            await this.updateReport(reportId, {
                validationHistory: history,
                lastValidationAttempt: attempt
            });

            return attempt;
        } catch (error) {
            console.error(`Error adding validation attempt for ${reportId}:`, error);
            throw new Error(`Failed to save validation attempt: ${error.message}`);
        }
    }

    /**
     * Moves a report to the incidents collection for admin review
     * @param {string} reportId - The report ID
     */
    async forwardToAdminReview(reportId) {
        try {
            const report = await this.getReport(reportId);
            if (!report) {
                throw new Error(`Report ${reportId} not found`);
            }

            // Move to incidents collection
            const incidentData = {
                ...report,
                forwardedAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'pending_admin_review',
                source: 'ai_validation_rejected'
            };

            await this.db.collection('incidents').doc(reportId).set(incidentData);

            // Update the original report status
            await this.updateReport(reportId, {
                status: 'forwarded_to_admin',
                forwardedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return reportId;
        } catch (error) {
            console.error(`Error forwarding report ${reportId} to admin:`, error);
            throw new Error(`Failed to forward report: ${error.message}`);
        }
    }

    /**
     * Gets statistics about the validation system
     */
    async getValidationStats() {
        try {
            const snapshot = await this.db.collection(this.collection).get();
            let totalReports = 0;
            let acceptedReports = 0;
            let rejectedReports = 0;
            let forwardedReports = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                totalReports++;
                if (data.status === 'accepted') acceptedReports++;
                if (data.status === 'rejected') rejectedReports++;
                if (data.status === 'forwarded_to_admin') forwardedReports++;
            });

            return {
                totalReports,
                acceptedReports,
                rejectedReports,
                forwardedReports,
                acceptanceRate: totalReports > 0 ? (acceptedReports / totalReports) * 100 : 0
            };
        } catch (error) {
            console.error('Error fetching validation stats:', error);
            throw new Error(`Failed to fetch stats: ${error.message}`);
        }
    }

    /**
     * Cleans up old validation attempts (optional maintenance)
     * @param {number} maxAgeDays - Maximum age in days for cleanup
     */
    async cleanupOldReports(maxAgeDays = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

            const snapshot = await this.db.collection(this.collection)
                .where('createdAt', '<', cutoffDate)
                .where('status', 'in', ['accepted', 'rejected'])
                .get();

            const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(deletePromises);

            return snapshot.docs.length;
        } catch (error) {
            console.error('Error during cleanup:', error);
            throw new Error(`Cleanup failed: ${error.message}`);
        }
    }
}

export const reportDatabase = new ReportDatabase();