"use client";

import { useState, useEffect } from "react";
import CompanyForm from "@/components/CompanyForm";
import CompanyList from "@/components/CompanyList";
import { Company } from "@/types";

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/companies");
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      const data = await response.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      setError("Failed to load companies. Please try again later.");
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: Company) => {
    try {
      setError(null);
      const method = selectedCompany ? "PUT" : "POST";
      const url = "/api/companies";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          selectedCompany ? { ...formData, id: selectedCompany.id } : formData
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to save company");
      }

      await fetchCompanies();
      setIsFormVisible(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error("Failed to save company:", error);
      setError("Failed to save company. Please try again.");
    }
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        setError(null);
        const response = await fetch(`/api/companies?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete company");
        }

        await fetchCompanies();
      } catch (error) {
        console.error("Failed to delete company:", error);
        setError("Failed to delete company. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Biotech Companies
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Track and manage your biotech company applications
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCompany(null);
                  setIsFormVisible(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Company
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {isFormVisible ? (
              <div className="p-6 sm:p-8">
                <CompanyForm
                  initialData={selectedCompany || undefined}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setIsFormVisible(false);
                    setSelectedCompany(null);
                  }}
                />
              </div>
            ) : (
              <div>
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                      Loading companies...
                    </p>
                  </div>
                ) : (
                  <CompanyList
                    companies={companies}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
