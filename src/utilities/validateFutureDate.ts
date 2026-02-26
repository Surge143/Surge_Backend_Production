export const validateFutureDate = (val: any): string | true => {
    if (!val) return true;

    const selectedDate = new Date(val);
    const now = new Date();

    if (selectedDate <= now) {
        return 'The selected date and time must be in the future.';
    }

    return true;
};
