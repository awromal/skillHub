import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Trash2, FileSpreadsheet, FileText as FileWord, FileText, Loader2, X, ChevronDown } from "lucide-react";
import { listApplications, deleteApplication, listAllCourses } from "@/lib/skillhub.functions";

type App = Awaited<ReturnType<typeof listApplications>>[number];

export const Route = createFileRoute("/admin/applications")({
  component: AdminApplications,
});

async function exportExcel(rows: App[]) {
  const [{ utils, writeFile }, { saveAs }] = await Promise.all([
    import("xlsx"),
    import("file-saver"),
  ]);
  void saveAs;
  const data = rows.map((a) => ({
    "Application ID": a.application_id,
    "Full Name": a.full_name,
    "Admission No": a.admission_number,
    "Roll No": a.roll_number,
    "Department": a.department,
    "Semester": a.semester,
    "Email": a.email,
    "Phone": a.phone,
    "Gender": a.gender,
    "Course": a.course_name,
    "Parent Name": a.parent_name ?? "",
    "Parent Phone": a.parent_phone ?? "",
    "Address": a.address ?? "",
    "Submitted": new Date(a.created_at).toLocaleString("en-IN"),
  }));
  const ws = utils.json_to_sheet(data);
  ws["!cols"] = Object.keys(data[0] ?? { x: "" }).map((k) => ({ wch: Math.max(14, k.length + 2) }));
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Applications");
  writeFile(wb, `skillhub-applications-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

async function exportWord(rows: App[]) {
  const [
    { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, BorderStyle, ShadingType, AlignmentType, PageOrientation },
    { saveAs },
  ] = await Promise.all([import("docx"), import("file-saver")]);

  const headers = ["App ID", "Name", "Department", "Sem", "Course", "Email", "Phone", "Submitted"];
  const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };

  function cell(text: string, opts: { bold?: boolean; fill?: string } = {}) {
    return new TableCell({
      borders: cellBorders,
      shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold, size: 18, color: opts.bold ? "FFFFFF" : "1F2937" })] })],
    });
  }

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => cell(h, { bold: true, fill: "0F4C81" })),
  });
  const dataRows = rows.map((a, i) => {
    const fill = i % 2 === 1 ? "F5F7FA" : undefined;
    const values = [
      a.application_id,
      a.full_name,
      a.department,
      a.semester,
      a.course_name,
      a.email,
      a.phone,
      new Date(a.created_at).toLocaleDateString("en-IN"),
    ];
    return new TableRow({ children: values.map((v) => cell(v, { fill })) });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  const doc = new Document({
    creator: "Skill Hub",
    title: "Applications",
    sections: [{
      properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Skill Hub – Applications List", bold: true, color: "0F4C81", size: 36 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "St. Berchmans College (Autonomous), Changanassery", italics: true, size: 20, color: "6B7280" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: `Generated ${new Date().toLocaleString("en-IN")} · ${rows.length} record${rows.length === 1 ? "" : "s"}`, size: 18, color: "6B7280" })],
        }),
        table,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `skillhub-applications-${new Date().toISOString().slice(0, 10)}.docx`);
}

function exportCsv(rows: App[]) {
  const headers = ["Application ID","Name","Admission No","Roll No","Department","Semester","Email","Phone","Gender","Course","Parent Name","Parent Phone","Address","Created At"];
  const csvRows = rows.map((a) => [
    a.application_id, a.full_name, a.admission_number, a.roll_number, a.department, a.semester,
    a.email, a.phone, a.gender, a.course_name, a.parent_name ?? "", a.parent_phone ?? "",
    (a.address ?? "").replace(/\n/g, " "), new Date(a.created_at).toISOString(),
  ]);
  const csv = [headers, ...csvRows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `skillhub-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminApplications() {
  const { data: apps = [], isLoading } = useQuery({ queryKey: ["admin-apps"], queryFn: () => listApplications() });
  const { data: courses = [] } = useQuery({ queryKey: ["admin-courses"], queryFn: () => listAllCourses() });
  const qc = useQueryClient();
  const del = useServerFn(deleteApplication);
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const [viewing, setViewing] = useState<App | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return apps.filter((a) => {
      if (course && a.course_id !== course) return false;
      if (!t) return true;
      return (
        a.full_name.toLowerCase().includes(t) ||
        a.email.toLowerCase().includes(t) ||
        a.application_id.toLowerCase().includes(t) ||
        a.phone.toLowerCase().includes(t)
      );
    });
  }, [apps, q, course]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this application?")) return;
    try {
      await del({ data: { id } });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-apps"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState<null | "csv" | "xlsx" | "docx">(null);

  async function handleExport(kind: "csv" | "xlsx" | "docx") {
    if (filtered.length === 0) { toast.error("Nothing to export"); return; }
    setMenuOpen(false);
    setExporting(kind);
    try {
      if (kind === "csv") exportCsv(filtered);
      else if (kind === "xlsx") await exportExcel(filtered);
      else await exportWord(filtered);
      toast.success(`Exported ${filtered.length} record${filtered.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally { setExporting(null); }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {apps.length} results</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl hover:shadow-brand/40 disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Export
            <ChevronDown className="h-4 w-4 opacity-80" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border bg-card shadow-2xl">
                <button onClick={() => handleExport("xlsx")} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-accent">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold">Excel (.xlsx)</div>
                    <div className="text-xs text-muted-foreground">All fields, formatted</div>
                  </div>
                </button>
                <button onClick={() => handleExport("docx")} className="flex w-full items-center gap-3 border-t px-4 py-3 text-left text-sm hover:bg-accent">
                  <FileWord className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-semibold">Word (.docx)</div>
                    <div className="text-xs text-muted-foreground">Branded report</div>
                  </div>
                </button>
                <button onClick={() => handleExport("csv")} className="flex w-full items-center gap-3 border-t px-4 py-3 text-left text-sm hover:bg-accent">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">CSV</div>
                    <div className="text-xs text-muted-foreground">Raw data</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, App ID…" className="w-full rounded-xl border bg-card py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2" />
        </div>
        <select value={course} onChange={(e) => setCourse(e.target.value)} className="w-full sm:w-auto rounded-xl border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-2">
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left text-xs uppercase text-muted-foreground">
              <th className="p-3">App ID</th>
              <th className="p-3">Student</th>
              <th className="p-3">Course</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="inline h-5 w-5 animate-spin text-brand" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No applications found.</td></tr>
            ) : filtered.map((a) => (
              <tr key={a.id} className="cursor-pointer border-t hover:bg-muted/30" onClick={() => setViewing(a)}>
                <td className="p-3 font-mono text-xs text-brand-2">{a.application_id}</td>
                <td className="p-3">
                  <div className="font-medium">{a.full_name}</div>
                  <div className="text-xs text-muted-foreground">{a.department} · Sem {a.semester}</div>
                </td>
                <td className="p-3">{a.course_name}</td>
                <td className="p-3 text-muted-foreground">
                  <div>{a.email}</div>
                  <div className="text-xs">{a.phone}</div>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("en-IN")}</td>
                <td className="p-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }} className="rounded-lg p-2 hover:bg-accent">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && <ViewModal app={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function ViewModal({ app, onClose }: { app: App; onClose: () => void }) {
  const rows: [string, string][] = [
    ["Application ID", app.application_id],
    ["Full Name", app.full_name],
    ["Admission Number", app.admission_number],
    ["Roll Number", app.roll_number],
    ["Department", app.department],
    ["Semester", app.semester],
    ["Email", app.email],
    ["Phone", app.phone],
    ["Gender", app.gender],
    ["Course", app.course_name],
    ["Parent Name", app.parent_name ?? "—"],
    ["Parent Phone", app.parent_phone ?? "—"],
    ["Address", app.address ?? "—"],
    ["Submitted", new Date(app.created_at).toLocaleString("en-IN")],
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4">
      <div className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-4 sm:p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand">{app.full_name}</h2>
            <div className="font-mono text-xs text-brand-2">{app.application_id}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        <dl className="grid gap-3 md:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
