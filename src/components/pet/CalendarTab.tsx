import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Symptom } from '../../types'

interface Props { symptoms: Symptom[] }

export function CalendarTab({ symptoms }: Props) {
  const { i18n } = useTranslation()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const symptomsByDate = symptoms.reduce<Record<string, Symptom[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = []
    acc[s.date].push(s)
    return acc
  }, {})

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const locale = i18n.language
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    .format(new Date(year, month, 1))

  // Week starting Sunday: 2024-01-07 is a Sunday
  const dowLabels = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + i))
  )

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function toDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const selectedSymptoms = selectedDate ? (symptomsByDate[selectedDate] ?? []) : []

  return (
    <div className="record-panel">
      <div className="calendar-nav">
        <button className="button-secondary" onClick={prevMonth}>←</button>
        <strong>{monthLabel}</strong>
        <button className="button-secondary" onClick={nextMonth}>→</button>
      </div>
      <div className="calendar-grid">
        {dowLabels.map(d => <div key={d} className="calendar-dow">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = toDateStr(day)
          const hasSymptom = !!symptomsByDate[dateStr]
          const isSelected = selectedDate === dateStr
          return (
            <div
              key={dateStr}
              className={`calendar-day${hasSymptom ? ' has-symptom' : ''}${isSelected ? ' is-selected' : ''}`}
              onClick={() => hasSymptom && setSelectedDate(isSelected ? null : dateStr)}
            >
              {day}
            </div>
          )
        })}
      </div>
      {selectedSymptoms.length > 0 && (
        <ul className="record-list">
          {selectedSymptoms.map(s => (
            <li key={s.id} className="record-item" style={{ gridTemplateColumns: '1fr' }}>
              <div>
                <strong>{s.title}</strong>
                <p className="record-meta">{s.date}{s.end_date ? ` — ${s.end_date}` : ''}</p>
                {s.description && <p>{s.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
