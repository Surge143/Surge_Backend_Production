import { Access } from 'payload';

export const canReadCart: Access = ({ req: { user } }) => {
    if (!user) return false;

    const userWithRole = user as any;
    if (userWithRole.role === 'admin' || userWithRole.role === 'super-admin') return true;

    return {
        user: {
            equals: user.id,
        },
    };
};

export const canUpdateOrDeleteCart: Access = ({ req: { user } }) => {
    if (!user) return false;

    // Type assertion to access custom role field
    const userWithRole = user as any;
    if (userWithRole.role === 'admin' || userWithRole.role === 'super-admin') return true;

    return {
        user: {
            equals: user.id,
        },
    };
};
