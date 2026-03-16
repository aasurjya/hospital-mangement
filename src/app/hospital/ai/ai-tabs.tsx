'use client'

import { useState } from 'react'
import { filterBar } from '@/lib/styles'
import { SoapTab } from './soap-tab'
import { DiagnosisTab } from './diagnosis-tab'
import { DrugCheckTab } from './drug-check-tab'
import { PatientSummaryTab } from './patient-summary-tab'

const TABS = [
  { id: 'soap', label: 'SOAP Notes' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'drug-check', label: 'Drug Check' },
  { id: 'summary', label: 'Patient Summary' },
] as const

type TabId = typeof TABS[number]['id']

export function AiTabs({ defaultTab }: { defaultTab?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.some((t) => t.id === defaultTab) ? (defaultTab as TabId) : 'soap'
  )

  return (
    <div>
      <div className="mb-6" role="tablist" aria-label="AI Assistant tools">
        <div className={filterBar.outer}>
          <div className={filterBar.inner}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={filterBar.pill(activeTab === tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div role="tabpanel" id={`panel-${activeTab}`}>
        {activeTab === 'soap' && <SoapTab />}
        {activeTab === 'diagnosis' && <DiagnosisTab />}
        {activeTab === 'drug-check' && <DrugCheckTab />}
        {activeTab === 'summary' && <PatientSummaryTab />}
      </div>
    </div>
  )
}
