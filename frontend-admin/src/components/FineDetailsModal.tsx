// A new component for the details modal
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Fine } from "@/screens/Fines";
import { Badge } from "./ui/badge";

interface FineDetailsModalProps {
  fine: Fine | null;
  isOpen: boolean;
  onClose: () => void;
}

const FineDetailsModal = ({ fine, isOpen, onClose }: FineDetailsModalProps) => {
  if (!fine) return null;

  const statusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "outstanding":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "waived":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Fine Details</DialogTitle>
          <DialogDescription>
            Complete information for fine ID: {fine._id}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className={statusBadgeColor(fine.status)}>
              {fine.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">User</span>
            <span>{fine.userId?.username || fine.userId?.email || "N/A"}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Item</span>
            <span>{fine.itemId?.title || "N/A"}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Reason</span>
            <span>{fine.reason}</span>
          </div>
          <hr />
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Amount Incurred</span>
            <span className="font-semibold">
              ₹{fine.amountIncurred.toFixed(2)}
            </span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Amount Paid</span>
            <span>₹{fine.amountPaid.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Outstanding</span>
            <span className="font-semibold text-rose-600">
              ₹{fine.outstandingAmount.toFixed(2)}
            </span>
          </div>
          <hr />
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Payment Method</span>
            <span>{fine.paymentDetails?.paymentMethod || "N/A"}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Transaction ID</span>
            <span>{fine.paymentDetails?.transactionId || "N/A"}</span>
          </div>
          <hr />
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Date Incurred</span>
            <span>{new Date(fine.dateIncurred).toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Date Settled</span>
            <span>
              {fine.dateSettled
                ? new Date(fine.dateSettled).toLocaleString()
                : "N/A"}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FineDetailsModal;
