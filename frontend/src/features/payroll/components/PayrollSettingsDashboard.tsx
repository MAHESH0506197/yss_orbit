import { useTranslation } from 'react-i18next';
import React from 'react';
import { useSalaryComponents, useSalaryStructures } from '../api/usePayroll';
import { Plus, Settings, DollarSign, Percent } from 'lucide-react';

export const PayrollSettingsDashboard = () => {
  const { t } = useTranslation();
  const { data: components, isLoading: loadingComps } = useSalaryComponents();
  const { data: structures, isLoading: loadingStructs } = useSalaryStructures();

  if (loadingComps || loadingStructs) return <div>{t('auto.loading_settings', 'Loading settings...')}</div>;

  return (
    <div className="space-y-8">
      {/* Salary Components Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{t('auto.salary_components', 'Salary Components')}</h2>
            <p className="text-sm text-gray-500">{t('auto.define_the_building_blocks_of_your_salary_structur', 'Define the building blocks of your salary structures.')}</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> {t('auto.new_component', 'New Component')}
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {components?.map((comp: any) => (
              <li key={comp.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${comp.component_type === 'EARNING' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{comp.name}</p>
                      <div className="flex space-x-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {comp.code}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {comp.calculation_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-gray-900">
                      {comp.calculation_type.includes('PERCENTAGE') ? `${comp.value}%` : `₹${comp.value}`}
                    </span>
                    {comp.is_taxable && <span className="text-xs text-gray-500 mt-1">{t('auto.taxable', 'Taxable')}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Salary Structures Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{t('auto.salary_structures', 'Salary Structures')}</h2>
            <p className="text-sm text-gray-500">{t('auto.group_components_into_assignable_pay_structures', 'Group components into assignable pay structures.')}</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> {t('auto.new_structure', 'New Structure')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {structures?.map((struct: any) => (
            <div key={struct.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{struct.name}</h3>
                  {struct.is_default && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {t('auto.default', 'Default')}
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {struct.components?.map((sc: any) => (
                    <div key={sc.id} className="flex justify-between text-sm">
                      <span className="text-gray-500">{sc.component?.name}</span>
                      <span className="text-gray-900 font-medium">
                        {sc.component?.calculation_type.includes('PERCENTAGE') ? `${sc.component.value}%` : `₹${sc.component.value}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6 text-right">
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  {t('auto.edit_structure', 'Edit Structure')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
