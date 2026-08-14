import React, { useState, useEffect } from "react";
import { FolderOpen, FileText, UploadCloud, CheckCircle2, AlertCircle, Eye, Download, ShieldCheck, Check, X } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const DocumentsPage = () => {
  const { user } = useAuth();
  const isPolicyholder = user?.role === "policyholder";
  const loggedInPid = user?.policyholder_id || user?.user_id;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const url = isPolicyholder && loggedInPid
        ? `/claims?policyholder_id=${loggedInPid}&limit=50`
        : "/claims?limit=50";

      const res = await api.get(url);
      const claimsData = res.data;

      // Extract all documents from fetched claims
      const allDocs = [];
      for (const c of claimsData) {
        if (c.documents && c.documents.length > 0) {
          c.documents.forEach((d) => {
            allDocs.push({
              doc_id: d.doc_id,
              claim_id: c.claim_id,
              name: d.filename || d.document_name,
              type: d.document_type || "Hospital Document",
              status: d.verification_status || "Pending Review",
              size: `${((d.file_size_bytes || 245000) / 1024).toFixed(1)} KB`,
              date: "2026-08-14"
            });
          });
        }
      }

      setDocuments(allDocs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [isPolicyholder, loggedInPid]);

  const handleVerify = async (claimId, docId) => {
    try {
      await api.post(`/claims/${claimId}/documents/${docId}/verify`);
      alert(`Document ${docId} verified successfully!`);
      fetchDocuments();
    } catch (err) {
      alert("Failed to verify document.");
    }
  };

  const handleReject = async (claimId, docId) => {
    try {
      await api.post(`/claims/${claimId}/documents/${docId}/reject`);
      alert(`Document ${docId} rejected.`);
      fetchDocuments();
    } catch (err) {
      alert("Failed to reject document.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-teal-600" />
            {isPolicyholder ? `My Medical Documents (${user?.full_name})` : "Document Verification Repository"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isPolicyholder
              ? `Displaying uploaded bills and medical evidence for ${loggedInPid}.`
              : "Audited clinical evidence, itemized bills, pre-auth letters, and verification status controls."}
          </p>
        </div>
      </div>

      {/* Document Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Hospital & Claim Files ({documents.length})</h3>
          <span className="text-xs text-teal-600 font-bold">256-bit Encrypted Storage</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Doc ID</th>
                <th className="py-3.5 px-4">Claim ID</th>
                <th className="py-3.5 px-4">Document Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">File Size</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Loading repository files...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No documents attached yet.
                  </td>
                </tr>
              ) : (
                documents.map((d) => {
                  const isVer = d.status.toLowerCase().includes("verified");
                  const isRej = d.status.toLowerCase().includes("rejected");
                  return (
                    <tr key={d.doc_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{d.doc_id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-800">{d.claim_id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                        {d.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{d.type}</td>
                      <td className="py-3.5 px-4 text-slate-500">{d.size}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          isVer 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : isRej
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {isVer ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isVer && (
                            <button
                              onClick={() => handleVerify(d.claim_id, d.doc_id)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Verify
                            </button>
                          )}
                          {!isRej && (
                            <button
                              onClick={() => handleReject(d.claim_id, d.doc_id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
