import { Response } from 'express';

interface ResponseData<T> {
    success: boolean;
    message: string;
    data?: T;
}

export const sendResponse = <T>(res: Response, statusCode: number, message: string, data?: T) => {
    const response: ResponseData<T> = {
        success: statusCode >= 200 && statusCode < 300,
        message,
    };

    if (data) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};
