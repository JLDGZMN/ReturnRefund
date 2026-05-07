const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const products = {
  jacket: {
    id: "jacket",
    name: "Cloudline Jacket",
    variant: "Sand / Medium",
    price: 128,
    maxQty: 1,
    thumbClass: "thumb-jacket",
  },
  denim: {
    id: "denim",
    name: "Studio Denim",
    variant: "Ink / 30W",
    price: 84,
    maxQty: 2,
    thumbClass: "thumb-denim",
  },
  cap: {
    id: "cap",
    name: "Atelier Cap",
    variant: "Slate / One Size",
    price: 36,
    maxQty: 1,
    thumbClass: "thumb-cap",
  },
};

const orderItems = [
  { productId: "jacket", qty: 1 },
  { productId: "denim", qty: 2 },
  { productId: "cap", qty: 1 },
];

const reasonMap = {
  "wrong-item": "Wrong item received",
  "damaged-item": "Damaged item",
  "missing-item": "Missing item",
  "not-described": "Item not as described",
  "change-mind": "Change of mind",
  "size-fit": "Size does not fit",
};

const requestTypeMap = {
  "refund-only": "Refund Only",
  "return-refund": "Return and Refund",
};

function formatMoney(value) {
  return money.format(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function describeProofCount(count) {
  return `${count} file${count === 1 ? "" : "s"}`;
}

function buildProofText(count) {
  if (count <= 0) {
    return "No proof attached.";
  }

  return `${count} proof file${count === 1 ? "" : "s"} attached.`;
}

function normalizeProofItems(proofItems = [], maxCount = 3) {
  return proofItems.slice(0, maxCount).map((item, index) => ({
    name: item?.name || `Proof ${index + 1}`,
    url: item?.url || "",
  }));
}

function createObjectProofItems(fileList) {
  return Array.from(fileList)
    .slice(0, 3)
    .map((file, index) => ({
      name: file.name || `Proof ${index + 1}`,
      url: URL.createObjectURL(file),
    }));
}

function revokeProofItems(proofItems = []) {
  proofItems.forEach((item) => {
    if (item?.url && item.url.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }
  });
}

function isProofRequired(reasonKey) {
  return ["wrong-item", "damaged-item", "missing-item"].includes(reasonKey);
}

function createCase({
  id,
  order,
  customer,
  productId,
  qty,
  requestTypeKey,
  reasonKey,
  status,
  note,
  proofCount,
  proofItems,
}) {
  const product = products[productId];
  const safeQty = clamp(qty ?? 1, 1, product?.maxQty ?? 1);
  const safeTypeKey = requestTypeKey ?? "refund-only";
  const safeReasonKey = reasonKey ?? "wrong-item";
  const safeProofCount = clamp(proofCount ?? 0, 0, 3);
  const safeProofItems = normalizeProofItems(proofItems, safeProofCount);

  return {
    id,
    order,
    customer,
    productId,
    product: product?.name ?? "Unknown Product",
    productVariant: product?.variant ?? "-",
    qty: safeQty,
    requestTypeKey: safeTypeKey,
    type: requestTypeMap[safeTypeKey] ?? "Refund Only",
    reasonKey: safeReasonKey,
    reason: reasonMap[safeReasonKey] ?? "Unknown Reason",
    amount: (product?.price ?? 0) * safeQty,
    note: note?.trim() || "No additional details provided.",
    status: status ?? "Pending",
    proofCount: safeProofCount,
    proofText: buildProofText(safeProofCount),
    proofItems: safeProofItems,
  };
}

function createDefaultConfirmationState() {
  return {
    visible: false,
    action: "",
    title: "",
    message: "",
    confirmLabel: "OK",
  };
}

const state = {
  mode: "customer",
  customerTab: "orders",
  adminFilter: "all",
  customer: {
    customerName: "Avery Santos",
    orderId: "RR-20481",
    draft: null,
    submittedRequestId: null,
  },
  admin: {
    selectedCaseId: "RET-1883",
  },
  ui: {
    isSubmitting: false,
    adminActionMessage: {
      caseId: null,
      tone: "",
      text: "",
    },
    toast: {
      tone: "",
      text: "",
      visible: false,
    },
    confirmation: createDefaultConfirmationState(),
  },
  cases: [
    createCase({
      id: "RET-1883",
      order: "ORD-88214",
      customer: "Mia Carter",
      productId: "jacket",
      qty: 1,
      requestTypeKey: "refund-only",
      reasonKey: "damaged-item",
      note: "Item arrived with a torn sleeve. Photos are attached for review.",
      status: "Pending",
      proofCount: 2,
    }),
    createCase({
      id: "RET-1884",
      order: "ORD-88227",
      customer: "Ethan Park",
      productId: "denim",
      qty: 1,
      requestTypeKey: "return-refund",
      reasonKey: "size-fit",
      note: "The waist is too tight. Requesting return and refund.",
      status: "Approved",
      proofCount: 0,
    }),
    createCase({
      id: "RET-1885",
      order: "ORD-88231",
      customer: "Lena Torres",
      productId: "jacket",
      qty: 1,
      requestTypeKey: "refund-only",
      reasonKey: "missing-item",
      note: "Package arrived incomplete.",
      status: "Rejected",
      proofCount: 1,
    }),
  ],
};

const modeButtons = document.querySelectorAll("[data-mode]");
const experiences = {
  customer: document.getElementById("customerExperience"),
  admin: document.getElementById("adminExperience"),
};
const tabButtons = document.querySelectorAll("[data-tab]");
const tabPanels = document.querySelectorAll("[data-panel]");
const selectItemButtons = document.querySelectorAll("[data-select-item]");
const orderActionButtons = document.querySelectorAll("[data-order-action]");
const requestTypeButtons = document.querySelectorAll("[data-request-type]");
const reasonButtons = document.querySelectorAll("[data-reason]");
const qtyButtons = document.querySelectorAll("[data-qty-action]");
const filterButtons = document.querySelectorAll("[data-filter]");

const orderTotalValue = document.getElementById("orderTotalValue");
const orderRefundValue = document.getElementById("orderRefundValue");
const orderStatusJacket = document.getElementById("orderStatus-jacket");
const orderStatusDenim = document.getElementById("orderStatus-denim");
const orderPriceJacket = document.getElementById("orderPrice-jacket");
const orderPriceDenim = document.getElementById("orderPrice-denim");
const requestEmptyState = document.getElementById("requestEmptyState");
const requestContent = document.getElementById("requestContent");
const selectedThumb = document.getElementById("selectedThumb");
const selectedProductName = document.getElementById("selectedProductName");
const selectedProductVariant = document.getElementById("selectedProductVariant");
const selectedProductPrice = document.getElementById("selectedProductPrice");
const quantityValue = document.getElementById("quantityValue");
const quantityHelp = document.getElementById("quantityHelp");
const proofInput = document.getElementById("proofInput");
const proofHelp = document.getElementById("proofHelp");
const requestProofPreviewGrid = document.getElementById("requestProofPreviewGrid");
const requestNote = document.getElementById("requestNote");
const requestValidationMessage = document.getElementById("requestValidationMessage");
const backToOrdersButton = document.getElementById("backToOrdersButton");
const backToRequestButton = document.getElementById("backToRequestButton");
const submitRequestButton = document.getElementById("submitRequestButton");
const openAdminButton = document.getElementById("openAdminButton");

const summaryProduct = document.getElementById("summaryProduct");
const summaryType = document.getElementById("summaryType");
const summaryReason = document.getElementById("summaryReason");
const summaryQty = document.getElementById("summaryQty");
const summaryProof = document.getElementById("summaryProof");
const summaryRefund = document.getElementById("summaryRefund");
const summaryNote = document.getElementById("summaryNote");
const refundNote = document.getElementById("refundNote");

const statusEmptyState = document.getElementById("statusEmptyState");
const statusContent = document.getElementById("statusContent");
const statusChip = document.getElementById("statusChip");
const statusRequestId = document.getElementById("statusRequestId");
const statusProductText = document.getElementById("statusProductText");
const statusTypeText = document.getElementById("statusTypeText");
const statusReasonText = document.getElementById("statusReasonText");
const statusProofText = document.getElementById("statusProofText");
const statusProofPreviewGrid = document.getElementById("statusProofPreviewGrid");
const statusNoteText = document.getElementById("statusNoteText");
const currentStatusStep = document.getElementById("currentStatusStep");
const currentStatusTitle = document.getElementById("currentStatusTitle");
const currentStatusMessage = document.getElementById("currentStatusMessage");
const returnStep = document.getElementById("returnStep");
const refundStep = document.getElementById("refundStep");
const nextActionText = document.getElementById("nextActionText");

const requestList = document.getElementById("requestList");
const metricPending = document.getElementById("metricPending");
const metricApproved = document.getElementById("metricApproved");
const metricRejected = document.getElementById("metricRejected");
const adminCaseTitle = document.getElementById("adminCaseTitle");
const adminCaseStatus = document.getElementById("adminCaseStatus");
const adminOrderValue = document.getElementById("adminOrderValue");
const adminCustomerValue = document.getElementById("adminCustomerValue");
const adminProductValue = document.getElementById("adminProductValue");
const adminTypeValue = document.getElementById("adminTypeValue");
const adminReasonValue = document.getElementById("adminReasonValue");
const adminAmountValue = document.getElementById("adminAmountValue");
const adminProofText = document.getElementById("adminProofText");
const adminProofPreviewGrid = document.getElementById("adminProofPreviewGrid");
const adminNoteText = document.getElementById("adminNoteText");
const adminRejectButton = document.getElementById("adminRejectButton");
const adminMoreInfoButton = document.getElementById("adminMoreInfoButton");
const adminApproveButton = document.getElementById("adminApproveButton");
const adminRefundButton = document.getElementById("adminRefundButton");
const adminActionMessage = document.getElementById("adminActionMessage");
const confirmationDialog = document.getElementById("confirmationDialog");
const confirmationTitle = document.getElementById("confirmationTitle");
const confirmationMessage = document.getElementById("confirmationMessage");
const confirmationCancelButton = document.getElementById("confirmationCancelButton");
const confirmationConfirmButton = document.getElementById("confirmationConfirmButton");
const toastMessage = document.getElementById("toastMessage");

let toastTimeoutId = null;

function getDraft() {
  return state.customer.draft;
}

function getSubmittedRequest() {
  if (!state.customer.submittedRequestId) {
    return null;
  }

  return (
    state.cases.find((item) => item.id === state.customer.submittedRequestId) ||
    null
  );
}

function getSelectedAdminCase() {
  if (!state.admin.selectedCaseId) {
    return null;
  }

  return state.cases.find((item) => item.id === state.admin.selectedCaseId) || null;
}

function getLatestCustomerCaseForProduct(productId) {
  return (
    state.cases.find(
      (item) =>
        item.customer === state.customer.customerName &&
        item.order === state.customer.orderId &&
        item.productId === productId,
    ) || null
  );
}

function getVisibleCases() {
  if (state.adminFilter === "all") {
    return state.cases;
  }

  if (state.adminFilter === "pending") {
    return state.cases.filter((item) =>
      ["Pending", "More Info Needed"].includes(item.status),
    );
  }

  return state.cases.filter((item) =>
    item.status.toLowerCase().includes(state.adminFilter),
  );
}

function getOrderTotal() {
  return orderItems.reduce((sum, item) => {
    const product = products[item.productId];
    return sum + (product?.price ?? 0) * item.qty;
  }, 0);
}

function getCompletedRefundTotal() {
  return state.cases
    .filter(
      (item) =>
        item.customer === state.customer.customerName &&
        item.order === state.customer.orderId &&
        item.status === "Refund Completed",
    )
    .reduce((sum, item) => sum + item.amount, 0);
}

function getNextRequestId() {
  const maxId = state.cases.reduce((currentMax, item) => {
    const match = /RET-(\d+)/.exec(item.id);
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);

  return `RET-${maxId + 1}`;
}

function createDraft(productId) {
  const product = products[productId];

  if (!product) {
    return null;
  }

  return {
    productId,
    qty: 1,
    requestTypeKey: "refund-only",
    reasonKey: "wrong-item",
    proofCount: 0,
    proofItems: [],
    note: "",
  };
}

function updateDraft(patch) {
  const draft = getDraft();

  if (!draft) {
    return;
  }

  state.customer.draft = {
    ...draft,
    ...patch,
  };
}

function clearDraft(options = {}) {
  const { preserveProofItems = false } = options;
  const draft = getDraft();

  if (draft && !preserveProofItems) {
    revokeProofItems(draft.proofItems);
  }

  state.customer.draft = null;
  proofInput.value = "";
  requestNote.value = "";
}

function clearAdminActionMessage() {
  state.ui.adminActionMessage = {
    caseId: null,
    tone: "",
    text: "",
  };
}

function openConfirmationDialog({
  action,
  title,
  message,
  confirmLabel = "OK",
}) {
  state.ui.confirmation = {
    visible: true,
    action,
    title,
    message,
    confirmLabel,
  };
  renderConfirmationDialog();
}

function closeConfirmationDialog() {
  state.ui.confirmation = createDefaultConfirmationState();
  renderConfirmationDialog();
}

function renderConfirmationDialog() {
  const dialog = state.ui.confirmation;

  confirmationDialog.classList.toggle("hidden", !dialog.visible);
  confirmationDialog.setAttribute("aria-hidden", String(!dialog.visible));
  confirmationTitle.textContent = dialog.title;
  confirmationMessage.textContent = dialog.message;
  confirmationConfirmButton.textContent = dialog.confirmLabel;
}

function renderToast() {
  const toast = state.ui.toast;

  toastMessage.textContent = toast.text;
  toastMessage.className = "toast";

  if (toast.tone === "success") {
    toastMessage.classList.add("is-success");
  }

  if (toast.visible && toast.text) {
    toastMessage.classList.add("is-visible");
  }
}

function showToast(text, tone = "success") {
  if (toastTimeoutId) {
    window.clearTimeout(toastTimeoutId);
  }

  state.ui.toast = {
    tone,
    text,
    visible: true,
  };
  renderToast();

  toastTimeoutId = window.setTimeout(() => {
    state.ui.toast = {
      tone: "",
      text: "",
      visible: false,
    };
    renderToast();
    toastTimeoutId = null;
  }, 2200);
}

function validateDraft(draft) {
  if (!draft) {
    return {
      isValid: false,
      message: "Select an item from the Orders tab to start a request.",
    };
  }

  const product = products[draft.productId];

  if (!product) {
    return {
      isValid: false,
      message: "The selected product is no longer available for return.",
    };
  }

  if (!reasonMap[draft.reasonKey]) {
    return {
      isValid: false,
      message: "Select a valid reason for the request.",
    };
  }

  if (draft.qty < 1 || draft.qty > product.maxQty) {
    return {
      isValid: false,
      message: "The selected quantity is outside the allowed return range.",
    };
  }

  if (isProofRequired(draft.reasonKey) && draft.proofCount < 1) {
    return {
      isValid: false,
      message: "At least one proof image is required for this request type.",
    };
  }

  return {
    isValid: true,
    message: "",
  };
}

function setMode(mode) {
  state.mode = mode;
}

function setCustomerTab(tab) {
  const hasDraft = Boolean(getDraft());
  const hasSubmittedRequest = Boolean(getSubmittedRequest());

  if (tab === "request" && !hasDraft) {
    state.customerTab = "orders";
    return;
  }

  if (tab === "status" && !hasSubmittedRequest) {
    state.customerTab = "orders";
    return;
  }

  state.customerTab = tab;
}

function setAdminFilter(filter) {
  state.adminFilter = filter;
}

function focusSubmittedRequestInAdmin() {
  const submittedRequest = getSubmittedRequest();

  if (!submittedRequest) {
    return;
  }

  state.admin.selectedCaseId = submittedRequest.id;
  state.adminFilter = "all";
}

function ensureAdminSelection() {
  const visibleCases = getVisibleCases();

  if (visibleCases.length === 0) {
    state.admin.selectedCaseId = null;
    return;
  }

  const selectedStillVisible = visibleCases.some(
    (item) => item.id === state.admin.selectedCaseId,
  );

  if (!selectedStillVisible) {
    state.admin.selectedCaseId = visibleCases[0].id;
  }
}

function statusClassFor(status) {
  if (status === "Approved" || status === "Refund Completed") {
    return "status-approved";
  }

  if (status === "Rejected") {
    return "status-rejected";
  }

  return "status-pending";
}

function renderProofGrid(container, proofItems = [], fallbackCount = 0) {
  const items = normalizeProofItems(proofItems);

  if (items.length === 0 && fallbackCount <= 0) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  container.innerHTML = "";

  if (items.length > 0) {
    items.forEach((item) => {
      const card = document.createElement("div");
      const image = document.createElement("img");

      card.className = "proof-card";
      image.src = item.url;
      image.alt = item.name;
      card.appendChild(image);
      container.appendChild(card);
    });
    return;
  }

  Array.from({ length: fallbackCount }, (_, index) => {
    const card = document.createElement("div");
    card.className = "proof-card proof-card-empty";
    card.textContent = `Proof ${index + 1}`;
    container.appendChild(card);
    return card;
  });
}

function getOrderStatusPresentation(caseItem) {
  if (!caseItem) {
    return {
      chipClass: "status-success",
      chipText: "Eligible",
      actionText: "Return / Refund",
    };
  }

  if (caseItem.status === "Approved" && caseItem.requestTypeKey === "return-refund") {
    return {
      chipClass: "status-approved",
      chipText: "Return Approved",
      actionText: "View Request",
    };
  }

  if (caseItem.status === "Approved") {
    return {
      chipClass: "status-approved",
      chipText: "Refund Processing",
      actionText: "View Request",
    };
  }

  if (caseItem.status === "Refund Completed") {
    return {
      chipClass: "status-approved",
      chipText: "Refunded",
      actionText: "View Request",
    };
  }

  if (caseItem.status === "Rejected") {
    return {
      chipClass: "status-rejected",
      chipText: "Rejected",
      actionText: "View Request",
    };
  }

  return {
    chipClass: "status-pending",
    chipText: caseItem.status,
    actionText: "View Request",
  };
}

function renderMode() {
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(experiences).forEach(([key, panel]) => {
    panel.classList.toggle("is-active", key === state.mode);
  });
}

function renderOrdersPanel() {
  const baseTotal = getOrderTotal();
  const refundedTotal = getCompletedRefundTotal();
  const netTotal = Math.max(baseTotal - refundedTotal, 0);

  orderPriceJacket.textContent = formatMoney(products.jacket.price);
  orderPriceDenim.textContent = formatMoney(products.denim.price);
  orderTotalValue.textContent =
    refundedTotal > 0
      ? `Total after refunds: ${formatMoney(netTotal)}`
      : `Total: ${formatMoney(baseTotal)}`;
  orderRefundValue.textContent =
    refundedTotal > 0 ? `Completed refunds: -${formatMoney(refundedTotal)}` : "";
  orderRefundValue.classList.toggle("hidden", refundedTotal <= 0);

  const jacketCase = getLatestCustomerCaseForProduct("jacket");
  const denimCase = getLatestCustomerCaseForProduct("denim");
  const jacketPresentation = getOrderStatusPresentation(jacketCase);
  const denimPresentation = getOrderStatusPresentation(denimCase);

  orderStatusJacket.className = `status-chip ${jacketPresentation.chipClass}`;
  orderStatusJacket.textContent = jacketPresentation.chipText;
  orderStatusDenim.className = `status-chip ${denimPresentation.chipClass}`;
  orderStatusDenim.textContent = denimPresentation.chipText;

  orderActionButtons.forEach((button) => {
    const matchingCase = getLatestCustomerCaseForProduct(button.dataset.orderAction);
    button.textContent = matchingCase ? "View Request" : "Return / Refund";
  });
}

function renderCustomerTabs() {
  const hasDraft = Boolean(getDraft());
  const hasSubmittedRequest = Boolean(getSubmittedRequest());

  if (state.customerTab === "request" && !hasDraft) {
    state.customerTab = "orders";
  }

  if (state.customerTab === "status" && !hasSubmittedRequest) {
    state.customerTab = "orders";
  }

  tabButtons.forEach((button) => {
    const tabName = button.dataset.tab;
    const isRequestTab = tabName === "request";
    const isStatusTab = tabName === "status";
    const isDisabled =
      (isRequestTab && !hasDraft) || (isStatusTab && !hasSubmittedRequest);

    button.classList.toggle("is-active", tabName === state.customerTab);
    button.disabled = isDisabled;
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === state.customerTab);
  });
}

function renderRequestPanel() {
  const draft = getDraft();
  const isSubmitting = state.ui.isSubmitting;

  requestEmptyState.classList.toggle("hidden", Boolean(draft));
  requestContent.classList.toggle("hidden", !draft);

  if (!draft) {
    requestValidationMessage.textContent = "";
    requestValidationMessage.classList.remove("is-error", "is-info");
    renderProofGrid(requestProofPreviewGrid);
    return;
  }

  const product = products[draft.productId];
  const validation = validateDraft(draft);

  selectedThumb.className = `thumb ${product.thumbClass}`;
  selectedProductName.textContent = product.name;
  selectedProductVariant.textContent = product.variant;
  selectedProductPrice.textContent = formatMoney(product.price);
  quantityValue.textContent = String(draft.qty);
  quantityHelp.textContent = `You can request up to ${product.maxQty} item${
    product.maxQty > 1 ? "s" : ""
  } for this product.`;

  requestTypeButtons.forEach((button) => {
    button.classList.toggle(
      "is-active",
      button.dataset.requestType === draft.requestTypeKey,
    );
    button.disabled = isSubmitting;
  });

  reasonButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.reason === draft.reasonKey);
    button.disabled = isSubmitting;
  });

  proofHelp.textContent = isProofRequired(draft.reasonKey)
    ? `Proof required. ${describeProofCount(draft.proofCount)} selected.`
    : `Proof optional. ${describeProofCount(draft.proofCount)} selected.`;
  renderProofGrid(requestProofPreviewGrid, draft.proofItems, draft.proofCount);

  if (requestNote.value !== draft.note) {
    requestNote.value = draft.note;
  }

  requestNote.disabled = isSubmitting;
  proofInput.disabled = isSubmitting;
  backToOrdersButton.disabled = isSubmitting;

  qtyButtons.forEach((button) => {
    if (button.dataset.qtyAction === "decrease") {
      button.disabled = isSubmitting || draft.qty <= 1;
    } else {
      button.disabled = isSubmitting || draft.qty >= product.maxQty;
    }
  });

  summaryProduct.textContent = product.name;
  summaryType.textContent = requestTypeMap[draft.requestTypeKey];
  summaryReason.textContent = reasonMap[draft.reasonKey];
  summaryQty.textContent = String(draft.qty);
  summaryProof.textContent = describeProofCount(draft.proofCount);
  summaryRefund.textContent = formatMoney(product.price * draft.qty);
  summaryNote.textContent = draft.note.trim() || "No additional details provided.";
  refundNote.textContent =
    draft.requestTypeKey === "refund-only"
      ? "Final refund amount is confirmed after seller review."
      : "Seller review may require the item to be returned before refund processing.";

  requestValidationMessage.textContent = isSubmitting
    ? "Submitting request..."
    : validation.message;
  requestValidationMessage.classList.toggle("is-error", !isSubmitting && !validation.isValid);
  requestValidationMessage.classList.toggle("is-info", isSubmitting);
  submitRequestButton.disabled = isSubmitting || !validation.isValid;
  submitRequestButton.textContent = isSubmitting ? "Submitting..." : "Submit Request";
}

function getStatusPresentation(request) {
  if (!request) {
    return {
      chipText: "Pending Seller Response",
      chipClass: "status-pending",
      title: "Pending Seller Response",
      message: "Please wait while the seller reviews your request.",
      nextAction: "Wait for seller review.",
      currentStep: "current",
      returnStepState: "idle",
      refundStepState: "idle",
    };
  }

  if (request.status === "Approved" && request.requestTypeKey === "return-refund") {
    return {
      chipText: "Please Return Item",
      chipClass: "status-approved",
      title: "Please Return Item",
      message: "Seller approved the request. Return instructions will be provided.",
      nextAction: "Pack the item and follow the return instructions.",
      currentStep: "complete",
      returnStepState: "current",
      refundStepState: "idle",
    };
  }

  if (request.status === "Approved") {
    return {
      chipText: "Refund Processing",
      chipClass: "status-approved",
      title: "Refund Processing",
      message: "Seller approved the request and refund processing has started.",
      nextAction: "Wait for refund processing.",
      currentStep: "complete",
      returnStepState: "idle",
      refundStepState: "current",
    };
  }

  if (request.status === "Refund Completed") {
    return {
      chipText: "Refund Completed",
      chipClass: "status-approved",
      title: "Refund Completed",
      message: "Your refund has been completed successfully.",
      nextAction: "No further action is required.",
      currentStep: "complete",
      returnStepState:
        request.requestTypeKey === "return-refund" ? "complete" : "idle",
      refundStepState: "complete-current",
    };
  }

  if (request.status === "Rejected") {
    return {
      chipText: "Rejected",
      chipClass: "status-rejected",
      title: "Rejected",
      message: "The seller rejected the request. Please review the case details.",
      nextAction: "Check the seller response or contact support.",
      currentStep: "current",
      returnStepState: "idle",
      refundStepState: "idle",
    };
  }

  if (request.status === "More Info Needed") {
    return {
      chipText: "More Info Needed",
      chipClass: "status-pending",
      title: "More Info Needed",
      message: "The seller asked for more proof before processing this request.",
      nextAction: "Upload more proof and resubmit the request.",
      currentStep: "current",
      returnStepState: "idle",
      refundStepState: "idle",
    };
  }

  return {
    chipText: "Pending Seller Response",
    chipClass: "status-pending",
    title: "Pending Seller Response",
    message: "Please wait while the seller reviews your request.",
    nextAction: "Wait for seller review.",
    currentStep: "current",
    returnStepState: "idle",
    refundStepState: "idle",
  };
}

function applyStepState(element, stateName) {
  element.classList.remove("is-current", "is-complete");

  if (stateName === "current") {
    element.classList.add("is-current");
  }

  if (stateName === "complete") {
    element.classList.add("is-complete");
  }

  if (stateName === "complete-current") {
    element.classList.add("is-complete", "is-current");
  }
}

function renderStatusPanel() {
  const submittedRequest = getSubmittedRequest();

  statusEmptyState.classList.toggle("hidden", Boolean(submittedRequest));
  statusContent.classList.toggle("hidden", !submittedRequest);

  if (!submittedRequest) {
    renderProofGrid(statusProofPreviewGrid);
    return;
  }

  const presentation = getStatusPresentation(submittedRequest);

  statusRequestId.textContent = `Request ID: ${submittedRequest.id}`;
  statusProductText.textContent = `${submittedRequest.product} • Qty ${submittedRequest.qty}`;
  statusTypeText.textContent = submittedRequest.type;
  statusReasonText.textContent = submittedRequest.reason;
  statusProofText.textContent = submittedRequest.proofText;
  renderProofGrid(
    statusProofPreviewGrid,
    submittedRequest.proofItems,
    submittedRequest.proofCount,
  );
  statusNoteText.textContent = submittedRequest.note;

  statusChip.className = `status-chip ${presentation.chipClass}`;
  statusChip.textContent = presentation.chipText;
  currentStatusTitle.textContent = presentation.title;
  currentStatusMessage.textContent = presentation.message;
  nextActionText.textContent = presentation.nextAction;

  applyStepState(currentStatusStep, presentation.currentStep);
  applyStepState(returnStep, presentation.returnStepState);
  applyStepState(refundStep, presentation.refundStepState);
}

function renderAdminMetrics() {
  metricPending.textContent = String(
    state.cases.filter((item) =>
      ["Pending", "More Info Needed"].includes(item.status),
    ).length,
  );
  metricApproved.textContent = String(
    state.cases.filter((item) => item.status === "Approved").length,
  );
  metricRejected.textContent = String(
    state.cases.filter((item) => item.status === "Rejected").length,
  );
}

function renderAdminFilters() {
  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.adminFilter);
  });
}

function renderCaseList() {
  ensureAdminSelection();

  const visibleCases = getVisibleCases();

  if (visibleCases.length === 0) {
    requestList.innerHTML =
      '<div class="note-box">No requests match the current filter.</div>';
    return;
  }

  requestList.innerHTML = visibleCases
    .map((item) => {
      const active = item.id === state.admin.selectedCaseId ? " is-active" : "";

      return `
        <button class="request-card${active}" type="button" data-case-id="${item.id}">
          <div class="request-card-header">
            <strong>${item.id}</strong>
            <span class="status-chip ${statusClassFor(item.status)}">${item.status}</span>
          </div>
          <div class="request-card-meta">
            <span>${item.customer}</span>
            <span>${formatMoney(item.amount)}</span>
          </div>
          <div class="request-card-meta">
            <span>${item.product}</span>
            <span>${item.type}</span>
          </div>
        </button>
      `;
    })
    .join("");

  requestList.querySelectorAll("[data-case-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.admin.selectedCaseId = button.dataset.caseId;
      renderAll();
    });
  });
}

function syncAdminActionButtons(selectedCase) {
  const hasCase = Boolean(selectedCase);

  adminApproveButton.disabled =
    !hasCase || ["Approved", "Refund Completed"].includes(selectedCase.status);
  adminRejectButton.disabled =
    !hasCase || ["Rejected", "Refund Completed"].includes(selectedCase.status);
  adminMoreInfoButton.disabled = !hasCase || selectedCase.status === "Refund Completed";
  adminRefundButton.disabled = !hasCase || selectedCase.status !== "Approved";
}

function renderCaseDetail() {
  const selectedCase = getSelectedAdminCase();

  if (!selectedCase) {
    adminCaseTitle.textContent = "No request selected";
    adminCaseStatus.className = "status-chip status-neutral";
    adminCaseStatus.textContent = "-";
    adminOrderValue.textContent = "-";
    adminCustomerValue.textContent = "-";
    adminProductValue.textContent = "-";
    adminTypeValue.textContent = "-";
    adminReasonValue.textContent = "-";
    adminAmountValue.textContent = formatMoney(0);
    adminProofText.textContent = "No proof attached.";
    renderProofGrid(adminProofPreviewGrid);
    adminNoteText.textContent = "No details provided.";
    adminActionMessage.textContent = "";
    adminActionMessage.className = "help-text inline-feedback";
    adminApproveButton.disabled = true;
    adminRejectButton.disabled = true;
    adminMoreInfoButton.disabled = true;
    adminRefundButton.disabled = true;
    return;
  }

  adminCaseTitle.textContent = selectedCase.id;
  adminCaseStatus.className = `status-chip ${statusClassFor(selectedCase.status)}`;
  adminCaseStatus.textContent = selectedCase.status;
  adminOrderValue.textContent = selectedCase.order;
  adminCustomerValue.textContent = selectedCase.customer;
  adminProductValue.textContent = `${selectedCase.product} • Qty ${selectedCase.qty}`;
  adminTypeValue.textContent = selectedCase.type;
  adminReasonValue.textContent = selectedCase.reason;
  adminAmountValue.textContent = formatMoney(selectedCase.amount);
  adminProofText.textContent = selectedCase.proofText;
  renderProofGrid(
    adminProofPreviewGrid,
    selectedCase.proofItems,
    selectedCase.proofCount,
  );
  adminNoteText.textContent = selectedCase.note;

  const actionMessage = state.ui.adminActionMessage;
  const shouldShowMessage = actionMessage.caseId === selectedCase.id && actionMessage.text;
  adminActionMessage.textContent = shouldShowMessage ? actionMessage.text : "";
  adminActionMessage.className = "help-text inline-feedback";
  if (shouldShowMessage && actionMessage.tone === "success") {
    adminActionMessage.classList.add("is-success");
  }

  syncAdminActionButtons(selectedCase);
}

function renderAll() {
  renderMode();
  renderOrdersPanel();
  renderCustomerTabs();
  renderRequestPanel();
  renderStatusPanel();
  renderAdminFilters();
  renderAdminMetrics();
  renderCaseList();
  renderCaseDetail();
  renderConfirmationDialog();
  renderToast();
}

function startRequest(productId) {
  if (state.ui.isSubmitting) {
    return;
  }

  clearDraft();
  state.customer.draft = createDraft(productId);
  setCustomerTab("request");
  renderAll();
}

function submitCurrentDraft() {
  const draft = getDraft();
  const validation = validateDraft(draft);

  if (state.ui.isSubmitting || !validation.isValid || !draft) {
    renderAll();
    return;
  }

  state.ui.isSubmitting = true;
  renderAll();

  window.setTimeout(() => {
    const latestDraft = getDraft();

    if (!latestDraft) {
      state.ui.isSubmitting = false;
      renderAll();
      return;
    }

    const newCase = createCase({
      id: getNextRequestId(),
      order: state.customer.orderId,
      customer: state.customer.customerName,
      productId: latestDraft.productId,
      qty: latestDraft.qty,
      requestTypeKey: latestDraft.requestTypeKey,
      reasonKey: latestDraft.reasonKey,
      note: latestDraft.note,
      status: "Pending",
      proofCount: latestDraft.proofCount,
      proofItems: latestDraft.proofItems,
    });

    state.cases.unshift(newCase);
    state.customer.submittedRequestId = newCase.id;
    state.admin.selectedCaseId = newCase.id;
    state.adminFilter = "all";
    state.ui.isSubmitting = false;

    clearDraft({ preserveProofItems: true });
    setCustomerTab("status");
    renderAll();
  }, 900);
}

function updateSelectedCaseStatus(nextStatus, successMessage = "") {
  const selectedCase = getSelectedAdminCase();

  if (!selectedCase) {
    return;
  }

  selectedCase.status = nextStatus;
  state.ui.adminActionMessage = {
    caseId: selectedCase.id,
    tone: successMessage ? "success" : "",
    text: successMessage,
  };
  renderAll();

  if (successMessage) {
    showToast(successMessage);
  }
}

function confirmPendingAction() {
  const { action } = state.ui.confirmation;

  if (!action) {
    closeConfirmationDialog();
    return;
  }

  closeConfirmationDialog();

  if (action === "submit-request") {
    submitCurrentDraft();
    return;
  }

  if (action === "approve-request") {
    updateSelectedCaseStatus("Approved", "Request approved successfully.");
    return;
  }

  if (action === "mark-refunded") {
    updateSelectedCaseStatus("Refund Completed", "Refund marked as completed.");
  }
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;

    if (mode === "admin") {
      focusSubmittedRequestInAdmin();
    }

    clearAdminActionMessage();
    setMode(mode);
    renderAll();
  });
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.disabled) {
      return;
    }

    clearAdminActionMessage();
    setCustomerTab(button.dataset.tab);
    renderAll();
  });
});

selectItemButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const productId = button.dataset.selectItem;
    const existingCase = getLatestCustomerCaseForProduct(productId);

    if (existingCase) {
      state.customer.submittedRequestId = existingCase.id;
      setCustomerTab("status");
      clearAdminActionMessage();
      renderAll();
      return;
    }

    startRequest(productId);
  });
});

requestTypeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!getDraft()) {
      return;
    }

    updateDraft({ requestTypeKey: button.dataset.requestType });
    renderAll();
  });
});

reasonButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!getDraft()) {
      return;
    }

    updateDraft({ reasonKey: button.dataset.reason });
    renderAll();
  });
});

qtyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const draft = getDraft();

    if (!draft) {
      return;
    }

    const product = products[draft.productId];
    const delta = button.dataset.qtyAction === "increase" ? 1 : -1;
    const nextQty = clamp(draft.qty + delta, 1, product.maxQty);

    updateDraft({ qty: nextQty });
    renderAll();
  });
});

proofInput.addEventListener("change", () => {
  const draft = getDraft();

  if (!draft) {
    return;
  }

  revokeProofItems(draft.proofItems);

  const proofItems = createObjectProofItems(proofInput.files);

  updateDraft({
    proofCount: proofItems.length,
    proofItems,
  });
  renderAll();
});

requestNote.addEventListener("input", () => {
  if (!getDraft()) {
    return;
  }

  updateDraft({ note: requestNote.value });
  renderAll();
});

backToOrdersButton.addEventListener("click", () => {
  clearAdminActionMessage();
  setCustomerTab("orders");
  renderAll();
});

backToRequestButton.addEventListener("click", () => {
  clearAdminActionMessage();
  setCustomerTab(getDraft() ? "request" : "orders");
  renderAll();
});

submitRequestButton.addEventListener("click", () => {
  const draft = getDraft();
  const validation = validateDraft(draft);

  if (!draft || !validation.isValid || state.ui.isSubmitting) {
    submitCurrentDraft();
    return;
  }

  openConfirmationDialog({
    action: "submit-request",
    title: "Submit Request",
    message:
      "Please confirm that the request details are complete and accurate. Select OK to submit this request for seller review.",
    confirmLabel: "OK",
  });
});

openAdminButton.addEventListener("click", () => {
  focusSubmittedRequestInAdmin();
  setMode("admin");
  renderAll();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setAdminFilter(button.dataset.filter);
    clearAdminActionMessage();
    renderAll();
  });
});

adminApproveButton.addEventListener("click", () => {
  const selectedCase = getSelectedAdminCase();

  if (!selectedCase) {
    return;
  }

  openConfirmationDialog({
    action: "approve-request",
    title: "Approve Request",
    message:
      "Please confirm that you want to approve this request. Select OK to continue and notify the customer.",
    confirmLabel: "OK",
  });
});

adminRejectButton.addEventListener("click", () => {
  updateSelectedCaseStatus("Rejected");
});

adminMoreInfoButton.addEventListener("click", () => {
  updateSelectedCaseStatus("More Info Needed");
});

adminRefundButton.addEventListener("click", () => {
  const selectedCase = getSelectedAdminCase();

  if (!selectedCase) {
    return;
  }

  openConfirmationDialog({
    action: "mark-refunded",
    title: "Mark Refund as Completed",
    message:
      "Please confirm that the refund has been completed. Select OK to update the request status for the customer.",
    confirmLabel: "OK",
  });
});

confirmationCancelButton.addEventListener("click", () => {
  closeConfirmationDialog();
});

confirmationConfirmButton.addEventListener("click", () => {
  confirmPendingAction();
});

confirmationDialog.addEventListener("click", (event) => {
  if (event.target === confirmationDialog) {
    closeConfirmationDialog();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.ui.confirmation.visible) {
    closeConfirmationDialog();
  }
});

window.addEventListener("beforeunload", () => {
  revokeProofItems(getDraft()?.proofItems);
  state.cases.forEach((item) => revokeProofItems(item.proofItems));
});

renderAll();
