import { ApiError } from "./apiError.js";


const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (err) {
            // console.log(err);
            if (err instanceof ApiError) {
                res.status(err.statusCode).json({
                    message: err.message,
                    statusCode: err.statusCode,
                    success: err.success,
                    errors: err.errors,
                });
            } else {
                res.status(500).json({
                    message: "Internal Server Error",
                });
            }
        }
    };
};

export { asyncHandler };