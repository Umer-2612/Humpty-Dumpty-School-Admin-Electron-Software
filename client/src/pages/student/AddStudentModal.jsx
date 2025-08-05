import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import { teal } from "@mui/material/colors";
import PersonIcon from "@mui/icons-material/Person";
import StudentForm from "./StudentForm";
import Modal from "../../component/Modal";

const AddStudentModal = ({
  open,
  onClose,
  classes,
  shifts,
  onSuccess,
  setError,
  setLoading,
}) => {
  const [form, setForm] = useState({
    name: "",
    roll_number: "",
    class_id: "",
    shift_id: "",
    parents_contact1: "",
    parents_contact2: "",
    admission_date: "",
    admission_end_date: "",
    gender: "",
    mother_name: "",
    father_name: "",
    fee_scholarship: "",
    birth_place: "",
    religion: "",
    address: "",
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const steps = ["Student Details", "Other Details"];

  const validateForm = () => {
    const newErrors = {};

    // Step 0 validation
    if (step === 0) {
      if (!form.name?.trim()) {
        newErrors.name = "Name is required";
      } else if (form.name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }

      if (!form.roll_number?.trim()) {
        newErrors.roll_number = "Roll number is required";
      } else if (isNaN(form.roll_number) || parseInt(form.roll_number) <= 0) {
        newErrors.roll_number = "Roll number must be a positive integer";
      }

      if (!form.class_id) {
        newErrors.class_id = "Class is required";
      }

      if (!form.shift_id) {
        newErrors.shift_id = "Shift is required";
      }
    }

    // Step 1 validation
    if (step === 1) {
      if (
        form.parents_contact1 &&
        !/^\d{10,11}$/.test(form.parents_contact1.replace(/\D/g, ""))
      ) {
        newErrors.parents_contact1 = "Parent contact must be 10-11 digits";
      }

      if (
        form.parents_contact2 &&
        !/^\d{10,11}$/.test(form.parents_contact2.replace(/\D/g, ""))
      ) {
        newErrors.parents_contact2 = "Parent contact must be 10-11 digits";
      }

      if (
        form.fee_scholarship &&
        (isNaN(form.fee_scholarship) || form.fee_scholarship < 0)
      ) {
        newErrors.fee_scholarship = "Fee scholarship must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep(step + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await window.electronAPI.addStudent(form);
      if (res.success) {
        setForm({
          name: "",
          roll_number: "",
          class_id: "",
          shift_id: "",
          parents_contact1: "",
          parents_contact2: "",
          admission_date: "",
          admission_end_date: "",
          gender: "",
          mother_name: "",
          father_name: "",
          fee_scholarship: "",
          birth_place: "",
          religion: "",
          address: "",
        });
        setErrors({});
        setStep(0);
        onSuccess();
      } else {
        setError(res.error || "Failed to add student");
      }
    } catch (err) {
      setError("Failed to add student", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Slide in={open} direction="down">
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            width: "100%",
            maxWidth: { xs: "98vw", sm: 420, md: 520 },
            minWidth: { xs: "90vw", sm: 340 },
            mx: "auto",
            bgcolor: "#f8fafc",
            maxHeight: { xs: "95vh", sm: "80vh", md: "70vh" },
            overflowY: "auto",
            p: { xs: 1, sm: 2 },
          }}
        >
          <Box
            sx={{
              bgcolor: teal[500],
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              p: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            <PersonIcon sx={{ color: "#fff", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Add Student
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2, bgcolor: "#f8fafc" }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Step {step + 1} of {steps.length}: {steps[step]}
            </Typography>
            <StudentForm
              form={form}
              setForm={setForm}
              classes={classes}
              step={step}
              shifts={shifts}
              errors={errors}
            />
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              bgcolor: "#f8fafc",
              p: 1,
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
            }}
          >
            <Button onClick={onClose}>Cancel</Button>
            {step > 0 && <Button onClick={handleBack}>Back</Button>}
            {step < steps.length - 1 ? (
              <Button onClick={handleNext} variant="contained">
                Next
              </Button>
            ) : (
              <Button
                onClick={handleAddStudent}
                variant="contained"
                color="primary"
              >
                Add Student
              </Button>
            )}
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default AddStudentModal;
