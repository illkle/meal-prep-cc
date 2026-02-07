import {
  useCallback,
  useMemo,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from 'react';

import { useHotkeys } from 'react-hotkeys-hook';

type GridMode = 'select' | 'edit';

type GridCoord = {
  rowId: string;
  colId: string;
};

type GridCellMeta = {
  element: HTMLTableCellElement;
  editable: boolean;
  editorType: 'text' | 'number';
};

type RegisterCellOptions = GridCoord & {
  editable: boolean;
  editorType: 'text' | 'number';
};

type UseTableKeyboardNavigationOptions = {
  rowIds: Array<string>;
  columnIds: Array<string>;
};

type MouseDownCaptureEvent = MouseEvent<HTMLElement>;
type EditorKeyDownEvent = KeyboardEvent<HTMLInputElement>;
type EditorFocusEvent = FocusEvent<HTMLInputElement>;

const selectedCellClasses = ['bg-accent/20', 'ring-1', 'ring-inset', 'ring-ring/60'];
const requireSecondClickToEdit = true;

function coordKey({ rowId, colId }: GridCoord): string {
  return `${rowId}::${colId}`;
}

function parseKey(key: string): GridCoord | null {
  const separatorIndex = key.indexOf('::');
  if (separatorIndex === -1) return null;

  const rowId = key.slice(0, separatorIndex);
  const colId = key.slice(separatorIndex + 2);
  if (!rowId || !colId) return null;

  return { rowId, colId };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function findGridEditor(cell: HTMLTableCellElement): HTMLInputElement | null {
  return cell.querySelector<HTMLInputElement>('[data-grid-editor="true"]');
}

function applySelectedCellClasses(cell: HTMLTableCellElement): void {
  cell.classList.add(...selectedCellClasses);
}

function removeSelectedCellClasses(cell: HTMLTableCellElement): void {
  cell.classList.remove(...selectedCellClasses);
}

function isGridEditorElement(node: EventTarget | null): node is HTMLInputElement {
  return node instanceof HTMLInputElement && node.dataset.gridEditor === 'true';
}

function selectInputContents(input: HTMLInputElement): void {
  try {
    input.select();
  } catch {
    return;
  }
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;

  if (!valueSetter) {
    return;
  }

  valueSetter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function isNumericKeyPress(event: globalThis.KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return false;
  }

  return /^[0-9]$/.test(event.key);
}

export type TableKeyboardNavigation = {
  tableRef: RefObject<HTMLDivElement | null>;
  registerCell: (
    options: RegisterCellOptions
  ) => (element: HTMLTableCellElement | null) => void;
  tableInteractionProps: {
    onMouseDownCapture: (event: MouseDownCaptureEvent) => void;
    onFocusCapture: () => void;
    onBlurCapture: (event: FocusEvent<HTMLElement>) => void;
  };
  getEditorHandlers: (
    coord: GridCoord,
    options?: GetEditorHandlersOptions
  ) => {
    onEditorFocus: (event: EditorFocusEvent) => void;
    onEditorBlur: () => void;
    onEditorKeyDown: (event: EditorKeyDownEvent) => void;
  };
};

type GetEditorHandlersOptions = {
  selectAllOnFocus?: boolean;
};

export function useTableKeyboardNavigation({
  rowIds,
  columnIds,
}: UseTableKeyboardNavigationOptions): TableKeyboardNavigation {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const cellsRef = useRef(new Map<string, GridCellMeta>());
  const cellRefCallbacksRef = useRef(
    new Map<string, (element: HTMLTableCellElement | null) => void>()
  );
  const cellEditableRef = useRef(new Map<string, boolean>());
  const cellEditorTypeRef = useRef(new Map<string, 'text' | 'number'>());
  const selectedCellRef = useRef<GridCoord | null>(null);
  const modeRef = useRef<GridMode>('select');
  const activeRef = useRef(false);
  const rowIdsRef = useRef(rowIds);
  const columnIdsRef = useRef(columnIds);

  rowIdsRef.current = rowIds;
  columnIdsRef.current = columnIds;

  const focusTable = useCallback(() => {
    tableRef.current?.focus();
  }, []);

  const setMode = useCallback((nextMode: GridMode) => {
    modeRef.current = nextMode;
  }, []);

  const setSelection = useCallback((nextSelection: GridCoord) => {
    const previousSelection = selectedCellRef.current;

    if (
      previousSelection &&
      previousSelection.rowId === nextSelection.rowId &&
      previousSelection.colId === nextSelection.colId
    ) {
      return;
    }

    if (previousSelection) {
      const previousCell = cellsRef.current.get(coordKey(previousSelection));
      if (previousCell) {
        removeSelectedCellClasses(previousCell.element);
      }
    }

    selectedCellRef.current = nextSelection;

    const nextCell = cellsRef.current.get(coordKey(nextSelection));
    if (nextCell) {
      applySelectedCellClasses(nextCell.element);
    }
  }, []);

  const enterEditMode = useCallback(() => {
    const selection = selectedCellRef.current;
    if (!selection) return;

    const selectedCell = cellsRef.current.get(coordKey(selection));
    if (!selectedCell || !selectedCell.editable) return;

    setMode('edit');
    const editor = findGridEditor(selectedCell.element);
    editor?.focus();
  }, [setMode]);

  const enterNumberEditWithValue = useCallback(
    (nextValue: string) => {
      const selection = selectedCellRef.current;
      if (!selection) return;

      const selectedCell = cellsRef.current.get(coordKey(selection));
      if (
        !selectedCell ||
        !selectedCell.editable ||
        selectedCell.editorType !== 'number'
      ) {
        return;
      }

      setMode('edit');

      const editor = findGridEditor(selectedCell.element);
      if (!editor) return;

      queueMicrotask(() => {
        editor.focus();
        setInputValue(editor, nextValue);
        const valueLength = editor.value.length;
        editor.setSelectionRange(valueLength, valueLength);
      });
    },
    [setMode]
  );

  const ensureSelection = useCallback(() => {
    const currentSelection = selectedCellRef.current;
    if (rowIdsRef.current.length === 0 || columnIdsRef.current.length === 0) {
      if (currentSelection) {
        const currentCell = cellsRef.current.get(coordKey(currentSelection));
        if (currentCell) {
          removeSelectedCellClasses(currentCell.element);
        }
      }
      selectedCellRef.current = null;
      return;
    }

    if (
      currentSelection &&
      rowIdsRef.current.includes(currentSelection.rowId) &&
      columnIdsRef.current.includes(currentSelection.colId)
    ) {
      const currentCell = cellsRef.current.get(coordKey(currentSelection));
      if (currentCell) {
        applySelectedCellClasses(currentCell.element);
        return;
      }
    }

    setSelection({ rowId: rowIdsRef.current[0], colId: columnIdsRef.current[0] });
  }, [setSelection]);

  const moveSelection = useCallback(
    (rowDelta: number, colDelta: number) => {
      ensureSelection();

      const selection = selectedCellRef.current;
      if (!selection) return;

      const rowIndex = rowIdsRef.current.indexOf(selection.rowId);
      const colIndex = columnIdsRef.current.indexOf(selection.colId);
      if (rowIndex === -1 || colIndex === -1) {
        ensureSelection();
        return;
      }

      const nextRowIndex = clamp(
        rowIndex + rowDelta,
        0,
        Math.max(0, rowIdsRef.current.length - 1)
      );
      const nextColIndex = clamp(
        colIndex + colDelta,
        0,
        Math.max(0, columnIdsRef.current.length - 1)
      );

      const nextSelection = {
        rowId: rowIdsRef.current[nextRowIndex],
        colId: columnIdsRef.current[nextColIndex],
      };

      setSelection(nextSelection);
    },
    [ensureSelection, setSelection]
  );

  useHotkeys(
    'up,down,left,right,w,a,s,d,enter,0,1,2,3,4,5,6,7,8,9',
    (event) => {
      if (!activeRef.current || modeRef.current !== 'select') return;

      const key = event.key.toLowerCase();

      switch (key) {
        case 'arrowup':
        case 'w':
          event.preventDefault();
          moveSelection(-1, 0);
          break;
        case 'arrowdown':
        case 's':
          event.preventDefault();
          moveSelection(1, 0);
          break;
        case 'arrowleft':
        case 'a':
          event.preventDefault();
          moveSelection(0, -1);
          break;
        case 'arrowright':
        case 'd':
          event.preventDefault();
          moveSelection(0, 1);
          break;
        case 'enter':
          event.preventDefault();
          enterEditMode();
          break;
        default:
          if (!isNumericKeyPress(event)) {
            return;
          }

          event.preventDefault();
          enterNumberEditWithValue(event.key);
          break;
      }
    },
    {
      preventDefault: false,
      enableOnFormTags: false,
    }
  );

  const registerCell = useCallback(
    ({ rowId, colId, editable, editorType }: RegisterCellOptions) => {
      const key = coordKey({ rowId, colId });
      cellEditableRef.current.set(key, editable);
      cellEditorTypeRef.current.set(key, editorType);

      const existingCell = cellsRef.current.get(key);
      if (existingCell) {
        cellsRef.current.set(key, {
          element: existingCell.element,
          editable,
          editorType,
        });
      }

      const existingRefCallback = cellRefCallbacksRef.current.get(key);
      if (existingRefCallback) {
        return existingRefCallback;
      }

      const refCallback = (element: HTMLTableCellElement | null) => {
        const currentEditable = cellEditableRef.current.get(key) ?? false;
        const currentEditorType = cellEditorTypeRef.current.get(key) ?? 'text';

        if (!element) {
          const removedCell = cellsRef.current.get(key);
          if (removedCell) {
            removeSelectedCellClasses(removedCell.element);
          }
          cellsRef.current.delete(key);

          const selected = selectedCellRef.current;
          if (selected && coordKey(selected) === key) {
            selectedCellRef.current = null;
          }
          return;
        }

        element.dataset.gridKey = key;

        cellsRef.current.set(key, {
          element,
          editable: currentEditable,
          editorType: currentEditorType,
        });

        const selected = selectedCellRef.current;
        if (selected && coordKey(selected) === key) {
          applySelectedCellClasses(element);
        }
      };

      cellRefCallbacksRef.current.set(key, refCallback);

      return refCallback;
    },
    []
  );

  const onMouseDownCapture = useCallback((event: MouseDownCaptureEvent) => {
    const target = event.target as HTMLElement;
    const cellElement = target.closest<HTMLTableCellElement>('td[data-grid-key]');
    if (!cellElement) return;

    const key = cellElement.dataset.gridKey;
    if (!key) return;

    const coord = parseKey(key);
    if (!coord) return;

    const previousSelection = selectedCellRef.current;
    const isSameCellClick =
      previousSelection?.rowId === coord.rowId && previousSelection?.colId === coord.colId;

    activeRef.current = true;
    setSelection(coord);

    const cell = cellsRef.current.get(key);
    if (!cell?.editable) return;

    const shouldEnterEditMode = requireSecondClickToEdit
      ? isSameCellClick
      : true;

    if (!shouldEnterEditMode) {
      setMode('select');

      const activeElement = document.activeElement;
      if (isGridEditorElement(activeElement)) {
        activeElement.blur();
      }

      event.preventDefault();
      focusTable();
      return;
    }

    setMode('edit');
    event.preventDefault();

    if (!target.closest('[data-grid-editor="true"]')) {
      const editor = findGridEditor(cell.element);
      if (editor) {
        queueMicrotask(() => editor.focus());
      }
      return;
    }

    queueMicrotask(() => {
      const editor = findGridEditor(cell.element);
      editor?.focus();
    });
  }, [focusTable, setMode, setSelection]);

  const tableInteractionProps = useMemo(
    () => ({
      onMouseDownCapture,
      onFocusCapture: () => {
        activeRef.current = true;
      },
      onBlurCapture: (event: FocusEvent<HTMLElement>) => {
        const nextFocusedNode = event.relatedTarget as Node | null;
        if (nextFocusedNode && event.currentTarget.contains(nextFocusedNode)) {
          return;
        }

        activeRef.current = false;
        setMode('select');
      },
    }),
    [onMouseDownCapture, setMode]
  );

  const getEditorHandlers = useCallback(
    (coord: GridCoord, options?: GetEditorHandlersOptions) => ({
      onEditorFocus: (event: EditorFocusEvent) => {
        activeRef.current = true;
        setSelection(coord);
        setMode('edit');

        if (options?.selectAllOnFocus ?? true) {
          selectInputContents(event.currentTarget);
        }
      },
      onEditorBlur: () => {
        setMode('select');
      },
      onEditorKeyDown: (event: EditorKeyDownEvent) => {
        if (event.key !== 'Escape' && event.key !== 'Enter') {
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
        }

        setMode('select');
        event.currentTarget.blur();
        focusTable();
      },
    }),
    [focusTable, setMode, setSelection]
  );

  return {
    tableRef,
    registerCell,
    tableInteractionProps,
    getEditorHandlers,
  };
}
