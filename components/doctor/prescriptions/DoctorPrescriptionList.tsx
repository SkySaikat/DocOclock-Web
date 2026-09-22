/**
 * Doctor "Prescriptions" list (Figma 307:13617): header + date pill + "Add Prescription", then the dashboard list panel
 * (search, filter, table, pagination). Read-only view over the doctor's saved prescriptions; patient name / serial come from
 * the linked appointment. "Add Prescription" hands over to the wizard (PrescriptionEditor).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { fetchAppointments, fetchPrescriptions, downloadPrescriptionPDF } from '../../../storage';
import { Appointment, Prescription } from '../../../types';
import { getLocalISODate } from '../../../utils/date';
import { useToast } from '../../ToastProvider';
import { DashboardButton, DS_ICONS, MaskIcon, SearchField } from '../../dashboard';
import { RowMenu, TableHead, TableCell, TableEnd, PersonCell, PaginationBar, FilterPill, formatLongDate } from '../../patient/DsTable';

type TimeKey = 'today' | 'week' | 'month' | 'year' | 'all';
const TIME_OPTIONS: { id: TimeKey; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

const inTimeWindow = (date: string, key: TimeKey) => {
  if (key === 'all') return true;
  const d = new Date(date);
  if (isNaN(d.getTime())) return true;
  const now = new Date();
  if (key === 'today') return date === getLocalISODate();
  if (key === 'week') { const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7); return d >= weekAgo; }
  if (key === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return d.getFullYear() === now.getFullYear();
};

interface Row extends Prescription {
  patientName: string;
  serialNumber?: number;
}

export const DoctorPrescriptionList: React.FC<{ doctorId?: string; onAdd: () => void }> = ({ doctorId, onAdd }) => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeKey>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId) { setIsLoading(false); return; }
    Promise.all([fetchPrescriptions(undefined, doctorId), fetchAppointments({ doctorId })])
      .then(([rxList, appts]) => {
        const byId = new Map<string, Appointment>(appts.map(a => [a.id, a]));
        setRows(rxList
          .map(rx => {
            const appt = byId.get(rx.appointmentId);
            return { ...rx, patientName: appt?.patientName || 'Patient', serialNumber: appt?.serialNumber };
          })
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      })
      .catch(err => console.error('Error loading prescriptions:', err))
      .finally(() => setIsLoading(false));
  }, [doctorId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter(r => !term || r.patientName.toLowerCase().includes(term) || (r.diagnosis || '').toLowerCase().includes(term))
      .filter(r => inTimeWindow(r.date, timeFilter));
  }, [rows, search, timeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const download = async (id: string) => {
    try {
      setDownloadingId(id);
      await downloadPrescriptionPDF(id);
    } catch (e) {
      console.error('Download failed:', e);
      showToast('Failed to download prescription. Please try again.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex animate-fade-in flex-col gap-6 font-display">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] font-normal leading-[normal] text-content-primary lg:text-ds-h36">Prescriptions</h1>
          <p className="text-ds-subtitle text-content-tertiary max-lg:text-ds-small">Create and share prescription with your patients</p>
        </div>
        <div className="flex items-stretch gap-1">
          <FilterPill
            label={TIME_OPTIONS.find(o => o.id === timeFilter)?.label ?? 'All Time'}
            icon={DS_ICONS.calendar}
            chevron={DS_ICONS.dropdown}
            options={TIME_OPTIONS}
            value={timeFilter}
            onSelect={id => { setTimeFilter(id as TimeKey); setPage(1); }}
          />
          <DashboardButton variant="gradient" onClick={onAdd} className="pr-3">
            <span className="relative z-[1] px-3">Add Prescription</span>
          </DashboardButton>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-white p-2">
        <SearchField value={search} onChange={v => { setSearch(v); setPage(1); }} />

        {isLoading ? (
          <p className="py-16 text-center text-ds-body text-content-tertiary">Loading prescriptions...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MaskIcon src={DS_ICONS.prescriptions} size={32} className="text-ink-300" />
            <p className="text-ds-body text-content-tertiary">{rows.length === 0 ? 'Prescriptions you write will appear here.' : 'No prescriptions match this search.'}</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3 p-2 md:hidden">
              {pageRows.map(r => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-ds-lg bg-white p-4 shadow-ds-rise outline outline-1 -outline-offset-1 outline-ink-100">
                  <div className="min-w-0">
                    <p className="truncate text-ds-subtitle text-content-primary">{r.patientName}</p>
                    <p className="truncate text-ds-small text-content-tertiary">{formatLongDate(r.date)}{r.serialNumber != null ? ` · Serial ${r.serialNumber}` : ''}</p>
                  </div>
                  <DashboardButton variant="monochrome" icon={false} className="h-10 px-4 text-[14px]" disabled={downloadingId === r.id} onClick={() => download(r.id)}>
                    {downloadingId === r.id ? 'Downloading…' : 'PDF'}
                  </DashboardButton>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <table className="w-full border-separate border-spacing-0 text-left">
                <TableHead columns={['Patient Name', 'Date', 'Serial', 'Status', 'Action']} />
                <tbody className="text-[14px] text-[#505050]">
                  {pageRows.map((r, i) => (
                    <tr key={r.id}>
                      <TableCell first={i === 0}><PersonCell name={r.patientName} /></TableCell>
                      <TableCell first={i === 0}>{formatLongDate(r.date)}</TableCell>
                      <TableCell first={i === 0}>{r.serialNumber ?? '—'}</TableCell>
                      {/* Figma list status is a plain coloured label (no chip); a saved prescription is always issued. */}
                      <TableCell first={i === 0}><span className="px-2 text-ds-small text-[#24b565]">Completed</span></TableCell>
                      <TableCell first={i === 0}>
                        <RowMenu
                          label={`Actions for ${r.patientName}`}
                          items={[{ label: downloadingId === r.id ? 'Downloading…' : 'Download PDF', onClick: () => download(r.id), disabled: downloadingId === r.id }]}
                        />
                      </TableCell>
                    </tr>
                  ))}
                  <TableEnd span={5} />
                </tbody>
              </table>
            </div>
            <PaginationBar page={safePage} pageCount={pageCount} perPage={perPage} onPage={p => setPage(Math.min(pageCount, Math.max(1, p)))} onPerPage={n => { setPerPage(n); setPage(1); }} />
          </>
        )}
      </div>
    </div>
  );
};
