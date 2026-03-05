import { Badge, type BadgeVariant } from "@/components/ui/badge";

type PayoutStatus = "pending" | "paid" | "failed";

const statusVariant: Record<PayoutStatus, BadgeVariant> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
};

const statusLabel: Record<PayoutStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
};

interface PayoutBadgeProps {
  status: PayoutStatus;
  className?: string;
}

function PayoutBadge({ status, className }: PayoutBadgeProps) {
  return (
    <Badge variant={statusVariant[status]} className={className}>
      {statusLabel[status]}
    </Badge>
  );
}

export { PayoutBadge };
export type { PayoutStatus };
