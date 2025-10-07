-- Add indexes for better performance
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_saccoId_idx" ON "User"("saccoId");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "User_creditScore_idx" ON "User"("creditScore");

CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");
CREATE INDEX "Transaction_type_status_idx" ON "Transaction"("type", "status");

CREATE INDEX "CreditScore_userId_idx" ON "CreditScore"("userId");
CREATE INDEX "CreditScore_createdAt_idx" ON "CreditScore"("createdAt");

-- Add constraints
ALTER TABLE "User" ADD CONSTRAINT "User_email_format" CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE "User" ADD CONSTRAINT "User_creditScore_range" CHECK (creditScore >= 0 AND creditScore <= 1000);
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_amount_positive" CHECK (amount > 0);
ALTER TABLE "CreditScore" ADD CONSTRAINT "CreditScore_range" CHECK (score >= 0 AND score <= 1000);

-- Add comments
COMMENT ON TABLE "User" IS 'Stores user information including SACCO members and administrators';
COMMENT ON TABLE "Sacco" IS 'Stores SACCO (Savings and Credit Cooperative Organization) information';
COMMENT ON TABLE "Transaction" IS 'Stores financial transactions including deposits, withdrawals, loans, and repayments';
COMMENT ON TABLE "CreditScore" IS 'Stores credit score history with blockchain verification hashes';

-- Create function for automatic credit score updates
CREATE OR REPLACE FUNCTION update_user_credit_score()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."creditScore" IS NOT NULL THEN
        UPDATE "User" 
        SET "creditScore" = NEW."creditScore"
        WHERE id = NEW."userId";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic credit score updates
CREATE TRIGGER trigger_update_credit_score
    AFTER INSERT ON "CreditScore"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_credit_score();