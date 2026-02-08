import {
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

import { Trash2Icon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { useLinkedValue } from '@/lib/useDbLinkedValue';

type EditableTextCellInputProps = {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  onEditorFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onEditorBlur?: () => void;
  onEditorKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

export function EditableTextCellInput({
  value,
  placeholder,
  onCommit,
  className,
  onEditorFocus,
  onEditorBlur,
  onEditorKeyDown,
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
      data-grid-editor="true"
      value={draftValue}
      onFocus={onEditorFocus}
      placeholder={placeholder}
      onChange={(event) => setDraftValue(event.target.value)}
      onBlur={() => {
        handleCommit();
        onEditorBlur?.();
      }}
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

        onEditorKeyDown?.(event);
      }}
      className={className}
    />
  );
}

export function EditableNumberCellInput({
  value,
  onCommit,
  className,
  onEditorFocus,
  onEditorBlur,
  onEditorKeyDown,
  dbTimestamp,
}: {
  value: number;
  onCommit: (value: number, timestamp: number) => void;
  className?: string;
  onEditorFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onEditorBlur?: () => void;
  onEditorKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  dbTimestamp: Date;
}) {
  const { internalValue, updateHandler } = useLinkedValue({
    value: String(value),
    onChange: (v, timestamp) => onCommit(Number(v), timestamp),
    timestamp: dbTimestamp?.getTime() || 0,
    validate: (v) => Number.isFinite(Number(v)) && Number(v) >= 0,
    throttleTime: 300,
  });

  return (
    <Input
      data-grid-editor="true"
      type="number"
      value={internalValue}
      onFocus={onEditorFocus}
      onChange={(event) => updateHandler(event.target.value)}
      onBlur={onEditorBlur}
      onKeyDown={onEditorKeyDown}
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
