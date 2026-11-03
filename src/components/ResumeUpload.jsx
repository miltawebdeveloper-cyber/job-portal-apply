import { useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config.js';
import { cx } from '../utils/cx.js';
import Icon from './Icon.jsx';

const ACCEPT = [
  '.pdf', '.doc', '.docx',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',');

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumeUpload({ file, error, onSelect }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  // Stop files dropped outside the drop zone from opening in the browser.
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  const handleInput = (e) => {
    onSelect(e.target.files[0] || null);
    e.target.value = ''; // allow choosing the same file again
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onSelect(dropped);
  };

  const handleRemove = () => {
    onSelect(null);
    inputRef.current.focus();
  };

  return (
    <div className={cx('field', error && 'is-invalid')}>
      <input
        ref={inputRef}
        className="visually-hidden"
        id="resume"
        name="resume"
        type="file"
        accept={ACCEPT}
        tabIndex={file ? -1 : 0}
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'resume-error' : undefined}
        onChange={handleInput}
      />

      {file ? (
        <div className="file-chip">
          <span className="file-icon"><Icon name="file" /></span>
          <span className="file-info">
            <strong>{file.name}</strong>
            <span>{file.name.split('.').pop().toUpperCase()} · {formatSize(file.size)}</span>
          </span>
          <span className="file-ok"><Icon name="check" /> Ready</span>
          <button type="button" className="file-remove" aria-label="Remove resume" onClick={handleRemove}>
            <Icon name="x" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="resume"
          className={cx('dropzone', dragging && 'is-dragover')}
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className="dz-icon"><Icon name="upload" /></span>
          <span className="dz-title">Drag &amp; drop your resume here, or <u>browse</u></span>
          <span className="dz-meta">PDF, DOC or DOCX · Max {CONFIG.maxResumeMB}&nbsp;MB</span>
        </label>
      )}

      {error && <p className="error" id="resume-error">{error}</p>}
    </div>
  );
}
