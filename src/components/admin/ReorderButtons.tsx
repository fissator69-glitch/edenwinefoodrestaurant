import { Button } from "@/components/ui/button";

export default function ReorderButtons(props: {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
}) {
  const { index, total, onMove } = props;
  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="sm" variant="outline" disabled={index <= 0} onClick={() => onMove(index, index - 1)}>
        Su
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={index >= total - 1} onClick={() => onMove(index, index + 1)}>
        Giù
      </Button>
    </div>
  );
}
