"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Insurer = {
  id: string;
  name: string;
  email: string;
};

type PartyForm = {
  id: string;
  name: string;
  vehicleRegistration: string;
  contactDetails: string;
  hasInsurance: boolean;
  insurerId: string;
};

const newParty = (): PartyForm => ({
  id: crypto.randomUUID(),
  name: "",
  vehicleRegistration: "",
  contactDetails: "",
  hasInsurance: false,
  insurerId: "",
});

export default function NewCaseForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [parties, setParties] = useState<PartyForm[]>([
    newParty(),
    newParty(),
  ]);

  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loadingInsurers, setLoadingInsurers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInsurers = async () => {
      try {
        const response = await fetch("/api/users/insurers");

        if (!response.ok) {
          throw new Error("Failed to load insurers.");
        }

        const data = await response.json();
        setInsurers(data.insurers ?? []);
      } catch {
        setError("Could not load the available insurers.");
      } finally {
        setLoadingInsurers(false);
      }
    };

    loadInsurers();
  }, []);

  const updateParty = (id: string, patch: Partial<PartyForm>) =>
    setParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );

  const addParty = () => setParties((prev) => [...prev, newParty()]);

  const removeParty = (id: string) =>
    setParties((prev) =>
      prev.length > 1 ? prev.filter((p) => p.id !== id) : prev
    );

  const hasInsuredParty = parties.some(
    (p) => p.hasInsurance && p.insurerId !== ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a case title.");
      return;
    }

    if (parties.length === 0) {
      setError("At least one party is required.");
      return;
    }

    const invalidParty = parties.some((party) => !party.name.trim());

    if (invalidParty) {
      setError("Please enter a name for every party.");
      return;
    }

    if (!hasInsuredParty) {
      setError(
        "At least one party needs an insurer before this case can be created."
      );
      return;
    }

    const invalidInsuredParty = parties.some(
      (party) => party.hasInsurance && !party.insurerId
    );

    if (invalidInsuredParty) {
      setError(
        "Please select an insurer for every party marked as insured."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          parties: parties.map((party) => ({
            name: party.name.trim(),
            vehicleRegistration:
              party.vehicleRegistration.trim() || undefined,
            contactDetails: party.contactDetails.trim() || undefined,
            insurerId: party.hasInsurance ? party.insurerId : undefined,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create case.");
      }

      router.push(`/cases/${data.case.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create case."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-2xl rounded-2xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          New case
        </h1>

        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the case details and every party involved. At least one party
          needs an insurer on file.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Input
              id="title"
              label="Case title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. N1 Highway collision, 18 Sept"
              required
            />

            <label
              htmlFor="description"
              className="flex flex-col gap-1.5 text-sm"
            >
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </span>

              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-lg border border-black/[.08] bg-transparent px-3.5 py-2.5 outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/30"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Parties involved
              </h2>

              <button
                type="button"
                onClick={addParty}
                className="text-sm font-medium text-black underline dark:text-zinc-50"
              >
                + Add party
              </button>
            </div>

            {parties.map((party, i) => (
              <div
                key={party.id}
                className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-500">
                    Party {i + 1}
                  </span>

                  {parties.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParty(party.id)}
                      className="text-sm text-zinc-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <Input
                  id={`${party.id}-name`}
                  label="Name"
                  value={party.name}
                  onChange={(e) =>
                    updateParty(party.id, { name: e.target.value })
                  }
                  required
                />

                <Input
                  id={`${party.id}-vehicle`}
                  label="Vehicle registration"
                  value={party.vehicleRegistration}
                  onChange={(e) =>
                    updateParty(party.id, {
                      vehicleRegistration: e.target.value,
                    })
                  }
                />

                <Input
                  id={`${party.id}-contact`}
                  label="Contact details"
                  value={party.contactDetails}
                  onChange={(e) =>
                    updateParty(party.id, {
                      contactDetails: e.target.value,
                    })
                  }
                />

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={party.hasInsurance}
                    onChange={(e) =>
                      updateParty(party.id, {
                        hasInsurance: e.target.checked,
                        insurerId: e.target.checked ? party.insurerId : "",
                      })
                    }
                  />

                  <span className="text-zinc-700 dark:text-zinc-300">
                    This party has insurance
                  </span>
                </label>

                {party.hasInsurance && (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`${party.id}-insurer`}
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Insurer
                    </label>

                    <select
                      id={`${party.id}-insurer`}
                      value={party.insurerId}
                      onChange={(e) =>
                        updateParty(party.id, {
                          insurerId: e.target.value,
                        })
                      }
                      required
                      disabled={loadingInsurers}
                      className="rounded-lg border border-black/[.08] bg-transparent px-3.5 py-2.5 outline-none focus:border-black/30 dark:border-white/[.145] dark:bg-zinc-950 dark:focus:border-white/30"
                    >
                      <option value="">
                        {loadingInsurers
                          ? "Loading insurers..."
                          : "Select an insurer"}
                      </option>

                      {insurers.map((insurer) => (
                        <option key={insurer.id} value={insurer.id}>
                          {insurer.name} ({insurer.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating case..." : "Create case"}
          </Button>
        </form>
      </div>
    </div>
  );
}
