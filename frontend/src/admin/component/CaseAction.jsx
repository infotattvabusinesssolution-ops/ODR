// src/admin/component/CaseActions.jsx
import { useState } from "react";
import ModalComponent from "./Modal/ModalComponent";
import NewCaseForm from "./Modal/NewCaseForm";
import EditCaseForm from "./Modal/EditCaseForm";

export default function CaseActions() {
  const [openModal, setOpenModal] = useState(null);

  const sampleCase = {
    requestType: "Service Request 2",
    title: "Existing Case Title",
    description: "This is an example case that can be edited.",
  };

  return (
    <div className="p-8 flex gap-6">
      <button
        onClick={() => setOpenModal("new")}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        + Add Case
      </button>

      <button
        onClick={() => setOpenModal("edit")}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
      >
        ✎ Edit Case
      </button>

      {openModal === "new" && (
        <ModalComponent title="Add New Case" onClose={() => setOpenModal(null)}>
          <NewCaseForm onClose={() => setOpenModal(null)} />
        </ModalComponent>
      )}

      {openModal === "edit" && (
        <ModalComponent title="Edit Case" onClose={() => setOpenModal(null)}>
          <EditCaseForm
            caseData={sampleCase}
            onClose={() => setOpenModal(null)}
          />
        </ModalComponent>
      )}
    </div>
  );
}
