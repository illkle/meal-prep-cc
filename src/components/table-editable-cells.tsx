import { useEffect, useState } from 'react';

import { Trash2Icon } from 'lucide-react';

import { Input } from '@/components/ui/input';

type EditableTextCellInputProps = {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
};

export function EditableTextCellInput({
  value,
  onCommit,
  className,
}: EditableTextCellInputProps) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  const handleCommit = () => {
    const nextValue = draftValue.trim();
    if (!nextValue || nextValue === value) return;
    onCommit(nextValue);
  };

  return (
    <Input
      value={draftValue}
      onChange={(event) => setDraftValue(event.target.value)}
      onBlur={handleCommit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleCommit();
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          setDraftValue(value);
          event.currentTarget.blur();
        }
      }}
      className={className}
    />
  );
}

type EditableNumberCellInputProps = {
  value: number;
  onCommit: (value: number) => void;
  className?: string;
};

export function EditableNumberCellInput({
  value,
  onCommit,
  className,
}: EditableNumberCellInputProps) {
  return (
    <Input
      type="number"
      value={value}
      onChange={(event) => onCommit(Number(event.target.value))}
      className={className}
    />
  );
}

type TableRowDeleteButtonProps = {
  onDelete: () => void;
  ariaLabel: string;
};

export function TableRowDeleteButton({
  onDelete,
  ariaLabel,
}: TableRowDeleteButtonProps) {
  return (
    <button
      type="button"
      onClick={onDelete}
      className="flex h-full w-full items-center justify-center px-2 text-muted-foreground transition-colors hover:bg-destructive/40"
      aria-label={ariaLabel}
    >
      <Trash2Icon className="size-4" />
    </button>
  );
}
