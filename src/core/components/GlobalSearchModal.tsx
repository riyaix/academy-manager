import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  FileText,
  FolderKanban,
  Search,
  UserRound,
} from "lucide-react";
import { Modal } from "./Modal";
import { searchAppEntities, type GlobalSearchResult } from "../../domain/search";
import { useAppStore } from "../../app/store/appStore";
import type { ViewId } from "../../app/navigation/types";

type GlobalSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (viewId: ViewId) => void;
};

const kindIcon = {
  student: UserRound,
  payment: FileText,
  course: BookOpen,
  group: FolderKanban,
} as const;

export function GlobalSearchModal({ open, onClose, onNavigate }: GlobalSearchModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const students = useAppStore((state) => state.students);
  const paymentRecords = useAppStore((state) => state.paymentRecords);
  const courses = useAppStore((state) => state.courses);
  const classGroups = useAppStore((state) => state.classGroups);

  const results = useMemo(
    () =>
      searchAppEntities(query, {
        students,
        paymentRecords,
        courses,
        classGroups,
      }),
    [query, students, paymentRecords, courses, classGroups],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const selectResult = (result: GlobalSearchResult) => {
    onNavigate(result.viewId);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("search.title")}
      description={t("search.description")}
      size="lg"
      hideCloseButton
    >
      <div className="space-y-3">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter" && results[activeIndex]) {
                event.preventDefault();
                selectResult(results[activeIndex]);
              }
            }}
            placeholder={t("search.placeholder")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            aria-label={t("search.placeholder")}
          />
        </label>

        <ul className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
              {query.trim() ? t("search.empty") : t("search.hint")}
            </li>
          ) : (
            results.map((result, index) => {
              const Icon = kindIcon[result.kind];
              const isActive = index === activeIndex;
              return (
                <li key={result.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[var(--color-info-surface)]"
                        : "hover:bg-[var(--color-surface-muted)]"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectResult(result)}
                  >
                    <Icon className="size-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-[var(--color-text)]">
                        {result.title}
                      </span>
                      <span className="block truncate text-xs text-[var(--color-text-muted)]">
                        {t(`search.kinds.${result.kind}`)} · {result.subtitle}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </Modal>
  );
}
