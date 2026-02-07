import {
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

import { Trash2Icon } from 'lucide-react';

import { Input } from '@/components/ui/input';

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

type EditableNumberCellInputProps = {
  value: number;
  onCommit: (value: number) => void;
  className?: string;
  onEditorFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onEditorBlur?: () => void;
  onEditorKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export function EditableNumberCellInput({
  value,
  onCommit,
  className,
  onEditorFocus,
  onEditorBlur,
  onEditorKeyDown,
}: EditableNumberCellInputProps) {
  return (
    <Input
      data-grid-editor="true"
      type="number"
      value={value}
      onFocus={onEditorFocus}
      onChange={(event) => onCommit(Number(event.target.value))}
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
