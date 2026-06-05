import { Appointment } from '../types';

export const generateGoogleCalendarLink = (appointment: Appointment): string => {
  const startDate = new Date(`${appointment.date}T${appointment.time}`);
  const endDate = new Date(startDate.getTime() + 30 * 60000); // Assume 30 min duration
  
  const formatDateForUrl = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const urlObj = new URL('https://calendar.google.com/calendar/r/eventedit');
  urlObj.searchParams.append('text', `Medical Appointment with ${appointment.doctorName}`);
  urlObj.searchParams.append('dates', `${formatDateForUrl(startDate)}/${formatDateForUrl(endDate)}`);
  urlObj.searchParams.append('details', `Appointment at ${appointment.hospitalName}\nConsultation Fee: BDT ${appointment.fee}\nSerial: ${appointment.serialNumber}\nDiagnosis/Category: ${appointment.category}`);
  urlObj.searchParams.append('location', `${appointment.hospitalName}, ${appointment.chamberLocation || ''}`);
  
  return urlObj.toString();
};

export const downloadICS = (appointment: Appointment) => {
  const startDate = new Date(`${appointment.date}T${appointment.time}`);
  const endDate = new Date(startDate.getTime() + 30 * 60000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DocOclock//Medical Appointment//EN',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@dococlock.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:Appointment: ${appointment.doctorName}`,
    `DESCRIPTION:Medical Consultation at ${appointment.hospitalName}. Serial: ${appointment.serialNumber}`,
    `LOCATION:${appointment.hospitalName}, ${appointment.chamberLocation || ''}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder for your medical appointment',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `appointment_${appointment.id}.ics`);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
