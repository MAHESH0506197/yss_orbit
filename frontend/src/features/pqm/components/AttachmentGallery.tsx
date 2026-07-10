// yss_orbit\frontend\src\features\pqm\components\AttachmentGallery.tsx
import React, { useState } from 'react';
import {
  FileText,
  Image,
  File,
  MapPin,
  AlertTriangle,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PQMAttachment, AttachmentStage } from '../types';

interface AttachmentGalleryProps {
  attachments: PQMAttachment[];
  onUpload?: (stage: AttachmentStage) => void;
  isAdmin?: boolean;
}

const STAGE_LABELS: Record<AttachmentStage, string> = {
  before:   'Before Works',
  after:    'After Works',
  document: 'Documents',
  drawing:  'Drawings',
  report:   'Reports',
};

const STAGE_ORDER: AttachmentStage[] = ['before', 'after', 'document', 'drawing', 'report'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function GPSBadge({ withinGeofence }: { withinGeofence: boolean | null | undefined }) {
  const { t } = useTranslation();

  if (withinGeofence === null || withinGeofence === undefined) return null;

  return withinGeofence ? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '10px',
        fontWeight: 600,
        color: '#059669',
        background: '#ECFDF5',
        border: '1px solid #6EE7B7',
        borderRadius: '999px',
        padding: '1px 6px',
      }}
      aria-label={t('pqm.attachment.gps_verified', 'Location verified')}
    >
      <MapPin size={9} />
      {t('pqm.attachment.location_verified', 'Location verified')}
    </span>
  ) : (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '10px',
        fontWeight: 600,
        color: '#B45309',
        background: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: '999px',
        padding: '1px 6px',
      }}
      aria-label={t('pqm.attachment.gps_outside', 'Outside geofence')}
    >
      <AlertTriangle size={9} />
      {t('pqm.attachment.outside_geofence', 'Outside geofence')}
    </span>
  );
}

function AttachmentCard({ attachment }: { attachment: PQMAttachment }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Preview area */}
      {isImage(attachment.mime_type) && attachment.signed_url && !imgError ? (
        <div
          style={{
            height: '120px',
            background: '#F9FAFB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img
            src={attachment.signed_url}
            alt={attachment.file_name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div
          style={{
            height: '80px',
            background: '#F9FAFB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
          }}
          aria-hidden="true"
        >
          {isImage(attachment.mime_type) ? (
            <Image size={28} />
          ) : attachment.mime_type === 'application/pdf' ? (
            <FileText size={28} />
          ) : (
            <File size={28} />
          )}
        </div>
      )}

      {/* Info */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={attachment.file_name}
        >
          {attachment.file_name}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>
            {formatBytes(attachment.file_size_bytes)}
          </span>

          {/* Never show raw GPS coords — only the geofence badge */}
          <GPSBadge withinGeofence={attachment.gps_within_geofence} />
        </div>

        {attachment.description && (
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
            {attachment.description}
          </p>
        )}

        {attachment.signed_url && (
          <a
            href={attachment.signed_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#2563EB',
              marginTop: '4px',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={10} />
            Open
          </a>
        )}
      </div>
    </div>
  );
}

export function AttachmentGallery({ attachments, onUpload }: AttachmentGalleryProps) {
  const { t } = useTranslation();

  const grouped = STAGE_ORDER.reduce<Record<AttachmentStage, PQMAttachment[]>>(
    (acc, stage) => {
      acc[stage] = attachments.filter((a) => a.attachment_stage === stage);
      return acc;
    },
    {} as Record<AttachmentStage, PQMAttachment[]>,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {STAGE_ORDER.map((stage) => {
        const items = grouped[stage];
        if (items.length === 0 && !onUpload) return null;

        return (
          <section key={stage}>
            {/* Section header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <h4
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {t(`pqm.attachment.stage_${stage}`, STAGE_LABELS[stage])}
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#9CA3AF',
                  }}
                >
                  ({items.length})
                </span>
              </h4>

              {onUpload && (
                <button
                  onClick={() => onUpload(stage)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px dashed #D1D5DB',
                    background: 'transparent',
                    color: '#6B7280',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Upload size={12} />
                  {t('pqm.attachment.upload', 'Upload')}
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                {t('pqm.attachment.none', 'No attachments in this category.')}
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '12px',
                }}
              >
                {items.map((att) => (
                  <AttachmentCard key={att.id} attachment={att} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {attachments.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '40px 0',
            color: '#9CA3AF',
          }}
        >
          <Paperclip size={28} />
          <p style={{ fontSize: '13px' }}>
            {t('pqm.attachment.empty', 'No attachments yet.')}
          </p>
        </div>
      )}
    </div>
  );
}

// local import for empty state
function Paperclip({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
