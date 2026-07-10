import { useTranslation } from 'react-i18next';
import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Download, FileSpreadsheet, UploadCloud, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useEmployeeImport } from '@/features/hrms/api/useEmployeeImport';

type Step = 'DOWNLOAD' | 'UPLOAD' | 'VALIDATING' | 'PREVIEW' | 'SUCCESS';

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmployeeImportWizard: React.FC<ImportWizardProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('DOWNLOAD');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { downloadTemplate, uploadFile, validateSession, executeSession, downloadErrors } = useEmployeeImport();

  const handleClose = () => {
    setStep('DOWNLOAD');
    setSessionId(null);
    setValidationResult(null);
    onOpenChange(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('VALIDATING');
    try {
      const id = await uploadFile.mutateAsync(file);
      setSessionId(id);
      
      const result = await validateSession.mutateAsync(id);
      setValidationResult(result);
      setStep('PREVIEW');
    } catch (error) {
      setStep('UPLOAD');
    }
  };

  const handleExecute = async () => {
    if (!sessionId) return;
    try {
      await executeSession.mutateAsync(sessionId);
      setStep('SUCCESS');
    } catch (error) {
      // stay on preview
    }
  };

  return (
    <Modal 
      isOpen={open} 
      onClose={handleClose}
      title={t('auto.bulk_employee_import', 'Bulk Employee Import')}
      description={
        step === 'DOWNLOAD' ? "Step 1: Download the template and fill in employee data." :
        step === 'UPLOAD' ? "Step 2: Upload your completed Excel file." :
        step === 'VALIDATING' ? "Step 3: Validating your data against system rules..." :
        step === 'PREVIEW' ? "Step 4: Review validation results." :
        "Step 5: Import completed successfully."
      }
      className="sm:max-w-[700px]"
    >
        <div className="mt-4">
          {step === 'DOWNLOAD' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <FileSpreadsheet className="w-16 h-16 text-indigo-500" />
              <h3 className="text-lg font-medium text-gray-900">{t('auto.download_template', 'Download Template')}</h3>
              <p className="text-sm text-center text-gray-500 max-w-sm">
                {t('auto.our_template_includes_all_necessary_columns_instru', 'Our template includes all necessary columns, instructions, and reference data to ensure a smooth import.')}
              </p>
              <Button onClick={downloadTemplate} className="mt-4">
                <Download className="w-4 h-4 mr-2" />
                {t('auto.download_excel_template', 'Download Excel Template')}
              </Button>
              <div className="mt-8">
                <Button variant="outline" onClick={() => setStep('UPLOAD')}>
                  {t('auto.i_already_have_a_completed_file', 'I already have a completed file')}
                </Button>
              </div>
            </div>
          )}

          {step === 'UPLOAD' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx"
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center w-full cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <UploadCloud className="w-12 h-12 text-gray-400" />
                <p className="mt-4 text-sm font-medium text-gray-900">{t('auto.click_to_upload_or_drag_and_drop', 'Click to upload or drag and drop')}</p>
                <p className="text-xs text-gray-500">{t('auto.only_xlsx_files_are_supported', 'Only .xlsx files are supported')}</p>
              </div>
              <Button variant="ghost" onClick={() => setStep('DOWNLOAD')}>{t('auto.back', 'Back')}</Button>
            </div>
          )}

          {step === 'VALIDATING' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900">{t('auto.validating_data', 'Validating Data...')}</h3>
              <p className="text-sm text-gray-500">{t('auto.checking_for_duplicates_formatting_and_relational_', 'Checking for duplicates, formatting, and relational integrity.')}</p>
            </div>
          )}

          {step === 'PREVIEW' && validationResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">{t('auto.total_rows', 'Total Rows')}</p>
                  <p className="text-2xl font-semibold">{validationResult.total_rows}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-green-600">{t('auto.valid_rows', 'Valid Rows')}</p>
                  <p className="text-2xl font-semibold text-green-700">{validationResult.valid_rows}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-red-600">{t('auto.error_rows', 'Error Rows')}</p>
                  <p className="text-2xl font-semibold text-red-700">{validationResult.error_rows}</p>
                </div>
              </div>

              {validationResult.status === 'FAILED' ? (
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">{t('auto.validation_failed', 'Validation Failed')}</h4>
                      <p className="text-sm text-red-700 mt-1">
                        {t('auto.please_download_the_error_report_fix_the_issues_in', 'Please download the error report, fix the issues in your Excel file, and try again.')}
                      </p>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('auto.row', 'Row')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('auto.column', 'Column')}</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('auto.error', 'Error')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {validationResult.error_grid.slice(0, 10).map((err: any, i: number) => (
                          <tr key={i}>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-900">{err.row}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-gray-900">{err.column}</td>
                            <td className="px-4 py-2 text-red-600">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {validationResult.error_grid.length > 10 && (
                      <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
                        {t('auto.showing_first_10_errors_download_report_for_all', 'Showing first 10 errors. Download report for all.')}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setStep('UPLOAD')}>{t('auto.upload_new_file', 'Upload New File')}</Button>
                    <Button variant="danger" onClick={() => downloadErrors(sessionId!)}>
                      <Download className="w-4 h-4 mr-2" />
                      {t('auto.download_error_report', 'Download Error Report')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800">{t('auto.validation_successful', 'Validation Successful')}</h4>
                      <p className="text-sm text-green-700 mt-1">
                        {t('auto.all', 'All')} {validationResult.valid_rows} {t('auto.rows_passed_validation_you_are_ready_to_import', 'rows passed validation. You are ready to import.')}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-8">
                    <Button variant="outline" onClick={() => setStep('UPLOAD')}>{t('auto.cancel', 'Cancel')}</Button>
                    <Button onClick={handleExecute} disabled={executeSession.isPending}>
                      {executeSession.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {t('auto.execute_import', 'Execute Import')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">{t('auto.import_completed_successfully', 'Import Completed Successfully')}</h3>
              <p className="text-sm text-gray-500 text-center">
                {t('auto.the_employees_have_been_added_to_the_system_and_ar', 'The employees have been added to the system and are now active.')}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg w-full mt-6">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-500">{t('auto.imported_records', 'Imported Records')}</span>
                  <span className="font-medium text-gray-900">{validationResult?.valid_rows}</span>
                </div>
              </div>
              <Button onClick={handleClose} className="mt-8 w-full">
                {t('auto.return_to_directory', 'Return to Directory')}
              </Button>
            </div>
          )}
        </div>
    </Modal>
  );
}
