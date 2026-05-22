const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense } = require("../controllers/expenseController");

router.route("/").get(protect, getExpenses).post(protect, createExpense);
router
  .route("/:id")
  .get(protect, getExpenseById)
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

module.exports = router;
