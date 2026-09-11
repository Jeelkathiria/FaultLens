import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useFaultLens } from '../../context/FaultLensContext';
import { Globe, Server, Check } from 'lucide-react';

export const AddWebsiteModal = ({ isOpen, onClose }) => {
  const { addWebsite } = useFaultLens();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [environment, setEnvironment] = useState('Production');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Website name is required';
    }
    if (!url.trim()) {
      newErrors.url = 'Website URL is required';
    } else if (!/^https?:\/\/|^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(url.trim())) {
      newErrors.url = 'Please enter a valid domain (e.g., api.mysite.com)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      addWebsite({
        name: name.trim(),
        url: url.trim(),
        environment,
        description: description.trim()
      });
      setIsSubmitting(false);
      setName('');
      setUrl('');
      setEnvironment('Production');
      setDescription('');
      setErrors({});
      onClose();
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Website Monitor">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Website / Application Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: null }));
            }}
            placeholder="e.g. My E-Commerce Store"
            className={`w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
              errors.name ? 'border-red-500/80 focus:border-red-500' : 'border-[#1E2633] focus:border-indigo-500'
            }`}
          />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
        </div>

        {/* URL */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Domain / URL *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errors.url) setErrors(prev => ({ ...prev, url: null }));
              }}
              placeholder="e.g. mystore.com or https://mystore.com"
              className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#080B12] border text-sm text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
                errors.url ? 'border-red-500/80 focus:border-red-500' : 'border-[#1E2633] focus:border-indigo-500'
              }`}
            />
          </div>
          {errors.url && <p className="text-xs text-red-400 mt-1">{errors.url}</p>}
        </div>

        {/* Environment */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Environment</label>
          <div className="grid grid-cols-3 gap-2">
            {['Production', 'Staging', 'Development'].map((env) => {
              const isSelected = environment === env;
              return (
                <button
                  type="button"
                  key={env}
                  onClick={() => setEnvironment(env)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                      : 'bg-[#080B12] border-[#1E2633] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                  {env}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief purpose of this web application service..."
            className="w-full px-3.5 py-2 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2633]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            {isSubmitting ? 'Adding Website...' : 'Add Website'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
