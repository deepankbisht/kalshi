const handleReponse = (message: string, status: number, data?: any) => {
    return {
        message,
        status: status|| 1,
        data: data || null,
    };
};

const handleError = (message: string, status: number, data?: any) => {
    return {
        message: message || "Error processin response",
        status: status || 0,
        data: data || null,
    };
};

export { handleReponse, handleError };
