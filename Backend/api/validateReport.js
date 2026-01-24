import cors from "cors";
import { reportValidator } from "../services/reportValidator.js";

const corsHandler = cors({ origin: true });

export default async function handler(req, res) {
  await new Promise((resolve) => corsHandler(req, res, resolve));

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: {
        type: "METHOD_NOT_ALLOWED",
        message: "Only POST requests are allowed"
      }
    });
  }

  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          type: "INVALID_REQUEST",
          message: "Request body must be a valid JSON object"
        }
      });
    }

    // Perform validation using the ReportValidator service
    const validationResult = await reportValidator.validateReport(req.body);

    // Return appropriate HTTP status based on result
    const httpStatus = validationResult.success ? 200 :
                      validationResult.action === 'forwarded_to_admin' ? 202 : 400;

    return res.status(httpStatus).json(validationResult);

  } catch (error) {
    console.error('API Error:', error);

    // Return structured error response
    return res.status(500).json({
      success: false,
      error: {
        type: "INTERNAL_ERROR",
        message: "An unexpected error occurred during validation",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}

// Additional endpoints for monitoring and management
export async function healthCheck(req, res) {
  await new Promise((resolve) => corsHandler(req, res, resolve));

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const health = await reportValidator.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;

    return res.status(statusCode).json(health);
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

export async function getValidationStats(req, res) {
  await new Promise((resolve) => corsHandler(req, res, resolve));

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stats = await reportValidator.getValidationStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        type: "STATS_ERROR",
        message: "Failed to retrieve validation statistics"
      }
    });
  }
}

export async function getReportHistory(req, res) {
  await new Promise((resolve) => corsHandler(req, res, resolve));

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reportId } = req.query;

  if (!reportId || typeof reportId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        type: "INVALID_REQUEST",
        message: "reportId query parameter is required"
      }
    });
  }

  try {
    const history = await reportValidator.getReportHistory(reportId);
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('History Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        type: "HISTORY_ERROR",
        message: "Failed to retrieve report history"
      }
    });
  }
}
