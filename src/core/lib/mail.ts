type PasswordResetMailPayload = {
    email: string;
    resetUrl: string;
};

export async function sendPasswordResetEmail({
    email,
    resetUrl,
}: PasswordResetMailPayload): Promise<void> {
    console.info(`[mail] Password reset for ${email}: ${resetUrl}`);
}
