CEE VALIDATION SYSTEM - COMPLETE UI SPECIFICATION
=================================================

Document Version: 1.0
Date: November 2025
Prepared for: Valoren.org

This document describes every screen, component, and data element in the CEE Validation System. The application serves three distinct user roles: Administrator, Validator, and Installer. Each role has access to different screens and capabilities.


PART ONE: USER ROLES AND ACCESS LEVELS
======================================

Role One: Administrator

The Administrator has complete access to all system functions. This role is responsible for configuring processes, defining document schemas, creating validation rules, managing users, and overseeing system operations. Administrators can also perform validation and billing tasks when needed. This role is intended for Valoren internal staff who manage the CEE validation workflow configuration.

Role Two: Validator

The Validator focuses on reviewing dossiers that have been processed by the AI system. This role can view extracted data, compare it against source documents, approve or reject dossiers, override validation warnings with justification, and initiate billing actions. Validators cannot modify process configurations, schemas, or rules. This role is intended for Valoren staff who perform quality control on CEE dossiers.

Role Three: Installer

The Installer has limited access focused on submitting dossiers and tracking their status. This role can upload documents for new dossiers, view the status of submitted dossiers, see validation results and required corrections, and download approved documents. Installers cannot access configuration, validation workflows, or other installers' data. This role is intended for partner installation companies who submit CEE dossiers to Valoren.


PART TWO: SHARED COMPONENTS
===========================

Before describing individual screens, here are components that appear across multiple screens.

Component: Application Header

The application header appears at the top of every screen and remains fixed during scrolling. On the left side is the Valoren logo which links to the dashboard. Next to the logo is the application name displayed as text. In the center is a search bar that allows users to search across dossiers, installers, and documents. The search bar shows a placeholder text indicating users can press Command plus K to activate it. On the right side are three elements: a notification bell icon showing a badge with the count of unread notifications, a help icon that opens documentation, and the user avatar with dropdown menu. The user dropdown contains the user's name, email, role badge, links to profile settings and preferences, and a logout button.

Component: Sidebar Navigation

The sidebar appears on the left side of all screens and can be collapsed to show only icons. The sidebar content varies by role. For Administrators, the sidebar contains links to Dashboard, Dossiers with a submenu for All Dossiers and Pending Review, Documents, Configuration with submenu for Processes and Document Types and Validation Rules and Field Schemas, Users, Analytics, Activity Log, and Settings. For Validators, the sidebar contains Dashboard, Dossiers with submenu for My Queue and All Dossiers and Pending Review, Documents, Billing, and Settings. For Installers, the sidebar contains Dashboard, My Dossiers, Upload New Dossier, and Settings. Each navigation item shows an icon, label text, and optionally a count badge for items requiring attention.

Component: Breadcrumb

The breadcrumb appears below the header on detail screens and shows the navigation path. Each level is clickable to navigate back. For example, when viewing a specific dossier validation screen, the breadcrumb would show Home, then Dossiers, then the dossier reference number.

Component: Page Title Section

Each page has a title section below the breadcrumb containing the page title as large text, an optional subtitle or description, and action buttons relevant to that page aligned to the right.

Component: Data Table

Data tables are used throughout the application for listing records. Each table includes a header row with sortable column labels, data rows with alternating background colors for readability, row actions shown as icon buttons or dropdown menus, pagination controls at the bottom showing current page and total pages and items per page selector, column visibility toggle, and export options for CSV and Excel. Tables support multi-select with checkboxes for bulk actions.

Component: Card

Cards are used to group related information. Each card has an optional header with title and actions, content area, and optional footer with secondary actions or metadata.

Component: Dialog

Dialogs are modal overlays used for forms, confirmations, and detail views. Each dialog has a header with title and close button, scrollable content area, and footer with action buttons. Dialogs can be dismissed by clicking outside or pressing Escape.

Component: Toast Notifications

Toast notifications appear in the bottom right corner to confirm actions or show errors. Each toast shows an icon indicating type such as success or error or warning, a message, and optionally an action button. Toasts auto-dismiss after five seconds unless the user hovers over them.

Component: Loading States

All data-fetching operations show loading states. Tables show skeleton rows. Cards show skeleton content blocks. Buttons show a spinner and disabled state when actions are processing.

Component: Empty States

When lists have no data, empty state components show an illustration, explanatory text, and a call-to-action button when applicable.


PART THREE: AUTHENTICATION SCREENS
==================================

Screen: Login Page

This screen is shown to unauthenticated users. The page has a centered card on a subtle gradient background.

The card contains the Valoren logo at the top, a welcome message reading Sign in to CEE Validation System, an email input field with label and validation, a password input field with label and show/hide toggle, a checkbox for Remember me option, a primary Sign In button that spans full width, a Forgot password link below the button, and at the bottom a note about contacting the administrator for account issues.

When the user submits invalid credentials, an error alert appears above the form explaining the issue. When login succeeds, the user is redirected to their role-appropriate dashboard.

Screen: Forgot Password

This screen allows users to request a password reset. The layout matches the login page with a centered card.

The card contains a back arrow link to return to login, a title reading Reset your password, explanatory text about receiving an email with reset instructions, an email input field, and a Send reset link button. After submission, the card content changes to show a confirmation message with instructions to check email.

Screen: Reset Password

This screen is accessed via the email link. The card contains a title, two password input fields for new password and confirmation, password strength indicator that updates as the user types, and a Set new password button. Validation ensures passwords match and meet complexity requirements.


PART FOUR: DASHBOARD SCREENS
============================

Screen: Administrator Dashboard

URL path is /dashboard. This is the landing page for administrators after login.

The page title section shows Dashboard as the title with a subtitle showing today's date and a greeting with the user's name.

Below the title is a row of four KPI cards arranged horizontally.

The first KPI card shows Pending Review. The main number displays the count of dossiers awaiting validation. Below the number is a comparison showing the change from yesterday with an arrow indicating increase or decrease and the percentage change. The card background has a subtle orange tint to indicate attention needed. Clicking this card navigates to the pending dossiers list.

The second KPI card shows Processed Today. The main number displays how many dossiers were processed today. The comparison shows the change from the same day last week. The card has a blue tint. Clicking navigates to today's processed dossiers.

The third KPI card shows Accuracy Rate. The main number displays the percentage of dossiers approved without human correction. The comparison shows the trend over the past week. The card has a green tint for positive metrics. Clicking navigates to the analytics page.

The fourth KPI card shows Average Processing Time. The main number displays the average time from upload to validation completion in minutes. The comparison shows improvement or regression from last week. The card has a purple tint.

Below the KPI row is the main content area divided into two columns.

The left column takes sixty percent of the width and contains the Dossiers Overview section. This section has tabs for filtering: All, New, Processing, Awaiting Review, Approved, Rejected, and Billed. Each tab shows a count in parentheses. Below the tabs is a data table showing dossiers.

The dossiers table columns are: Reference which shows the dossier ID formatted as VAL-2025-XXXX, Beneficiary showing name and truncated address, Process showing the CEE operation code like BAR-TH-171, Installer showing the company name, Status showing a colored badge, Confidence showing a percentage with a small progress bar, Date showing relative time like 2 hours ago, and Actions showing a menu button.

The table shows the ten most recent dossiers matching the selected tab filter. Clicking a row navigates to the dossier detail page. The actions menu contains View Details, Assign to Validator, and Mark as Priority.

Below the table is a Show all dossiers link that navigates to the full dossiers list page.

The right column takes forty percent of the width and contains two stacked sections.

The first section is Recent Activity showing a live feed of system events. Each activity item shows a timestamp, an icon indicating the event type, a description of the event, and the user who performed it. Events include dossier uploads, validations, approvals, rejections, and configuration changes. The feed auto-updates via websocket connection. A View all activity link navigates to the full activity log.

The second section is Quick Actions showing a grid of action buttons. The buttons are: New Dossier which opens the upload flow, Add Installer which opens the installer creation dialog, Configure Process which navigates to process configuration, and View Reports which navigates to analytics.

At the bottom of the page is a System Status section showing a horizontal bar with service health indicators. Each indicator shows a colored dot and service name: API, Database, Storage, AI Services, and Search. Green indicates healthy, yellow indicates degraded, and red indicates down.

Screen: Validator Dashboard

URL path is /dashboard. This is the landing page for validators.

The layout is similar to the administrator dashboard but focused on validation tasks.

The KPI cards row shows four metrics: My Queue showing the count of dossiers assigned to this validator, Validated Today showing personal productivity, Pending Review showing the total across all validators, and Team Accuracy showing the overall validation accuracy rate.

The main content area has two columns.

The left column shows My Validation Queue. This section does not have tabs. It shows a table of dossiers assigned to this validator, sorted by priority and then by age. The table columns are: Priority showing a colored indicator for high/normal/low, Reference, Beneficiary, Process, Uploaded showing relative time, Confidence, and a Validate button that navigates to the validation screen. Rows with validation errors are highlighted with a red left border. Rows with only warnings have a yellow border.

Below the table is a section for Unassigned Dossiers showing dossiers not yet assigned to any validator. Each row has a Claim button to self-assign.

The right column shows Recent Validations listing this validator's recent work. Each item shows the dossier reference, outcome as approved or rejected, time completed, and a link to view details. Below this is a Performance Summary card showing weekly statistics: dossiers validated, approval rate, average time per dossier, and accuracy rate compared to final outcomes.

Screen: Installer Dashboard

URL path is /dashboard. This is the landing page for installers.

The page title shows Welcome back with the company name.

The KPI cards row shows three metrics: Active Dossiers showing count of dossiers in progress, Approved This Month showing successful dossiers, and Pending Payment showing dossiers approved but not yet paid.

The main content is a single-column layout.

The first section is Submit New Dossier which is a prominent call-to-action card. The card has a large icon, title text reading Start a new CEE dossier, description text explaining the process, and a large button reading Upload Documents. Clicking navigates to the upload flow.

The second section is My Recent Dossiers showing a table of the installer's dossiers. The table columns are: Reference, Beneficiary Name, Operation showing the process type, Status with colored badge, Submitted Date, and Actions with a View button. Status values are: Draft for incomplete uploads, Processing for AI analysis in progress, Awaiting Review for pending human validation, Approved, Rejected, and Paid.

Clicking a row navigates to a read-only dossier view showing extracted data and validation results. If a dossier is rejected, the view shows the rejection reason and required corrections.

Below the table is pagination and a View all my dossiers link.

The third section is Notifications showing recent updates about this installer's dossiers. Each notification shows an icon, message such as Dossier VAL-2025-1234 has been approved, and timestamp. Unread notifications have a blue dot indicator.


PART FIVE: DOSSIER LIST AND DETAIL SCREENS
==========================================

Screen: All Dossiers List

URL path is /dossiers. Accessible by administrators and validators.

The page title is Dossiers with a subtitle showing the total count. The action buttons on the right are Export and New Dossier.

Below the title is a filter bar containing multiple filter controls. The first control is a search input for searching by reference, beneficiary name, or address. The second control is a status dropdown with options for All Statuses, New, Processing, Awaiting Review, Approved, Rejected, and Billed. The third control is a process dropdown listing all active processes. The fourth control is an installer dropdown with searchable list of installers. The fifth control is a date range picker for filtering by submission date. The sixth control is an assigned validator dropdown for filtering by who is handling the dossier. There is a Clear filters button to reset all filters.

The main content is a data table with the following columns. The checkbox column allows selecting multiple rows. Reference column shows the dossier ID with a link to the detail page. Beneficiary column shows the name on the first line and the work address truncated on the second line. Process column shows the CEE operation code and name. Installer column shows the company name with a link to the installer profile. Status column shows a colored badge. Confidence column shows a percentage and a mini progress bar colored green above 90 percent, yellow between 70 and 90, and red below 70. Validator column shows the assigned validator name or Unassigned. Updated column shows relative time. Actions column shows a three-dot menu button.

The actions menu for each row contains: View Details, Open in Validation View for rows pending review, Assign to Validator which opens an assignment dialog, Mark as Priority which toggles priority status, and for approved dossiers View Billing.

When rows are selected, a bulk actions bar appears above the table showing the count of selected items and buttons for: Assign to Validator, Change Priority, and Export Selected.

Pagination controls at the bottom show: Items per page dropdown with options 10, 25, 50, and 100; current page indicator showing Page X of Y; and previous/next navigation buttons.

Screen: Dossier Detail View

URL path is /dossiers/[id]. This is a read-only view of dossier information accessible by all roles.

The page title shows the dossier reference. The subtitle shows the current status as a badge, the process name, and the submission date. Action buttons on the right vary by role and status: for validators on pending dossiers there is an Open Validation button; for administrators there is an Edit button and Delete button; for approved dossiers all roles see a View Billing button.

The page content is divided into sections using cards.

The first card is Dossier Information. This card has two columns. The left column shows: Reference Number, Process with the code and name, Status with colored badge, Installer with company name as a link, Submitted date and time, and Last Updated date and time. The right column shows: Assigned Validator with name or Unassigned and an Assign button for administrators, Priority level, Confidence Score as percentage with progress bar, and Processing Time showing duration from submission to current state.

The second card is Beneficiary Information. This card shows: Full Name, Address showing the complete work address on multiple lines, City and Postal Code, Email if provided, Phone if provided, and Precarity Status showing the income category.

The third card is Documents. This card shows a list of all documents in the dossier. Each document row shows: an icon indicating the document type, the document type name such as Devis or Facture, the original filename, upload date, processing status as a badge, confidence score, and action buttons for Preview and Download. The Preview button opens the document in a dialog with the document viewer component. For documents with extraction issues, a warning icon appears with a tooltip explaining the problem.

The fourth card is Extracted Data. This card shows the key data extracted from all documents grouped by category. Each category has a collapsible header. The Identification category shows fields like quote number, quote date, invoice number, and invoice date. The Financial category shows prime CEE amount, total TTC amount, amount remaining to pay. The Technical category shows equipment brand and model, power rating, efficiency rating, heated surface area, and climate zone. The Signatures category shows presence indicators for each required signature and the Bon pour accord mention. Each field shows the field label, extracted value, source document as a small badge, and confidence percentage. Fields with low confidence are highlighted with a yellow background. Fields with validation errors have a red background.

The fifth card is Validation Results. This card shows the outcome of all validation rules. The card header shows summary counts: X passed, Y warnings, Z errors. The content is divided into three collapsible sections. The Passed Rules section shows a list of rule names with green checkmarks, collapsed by default. The Warnings section shows rules that triggered warnings with yellow icons, each showing the rule name and the warning message. The Errors section shows rules that failed with red icons, each showing the rule name and error message with specific values that caused the failure. If the dossier has been validated, this section also shows who validated it and when, any override notes entered by the validator.

The sixth card is Activity History. This card shows a timeline of all events for this dossier. Each event shows: timestamp, event description, user who performed the action, and any additional details. Events include: Created, Document Uploaded for each document, Processing Started, Classification Complete, Extraction Complete, Validation Started, Validation Complete, Assigned to Validator, Validated by with outcome, Correction Requested, and Payment Initiated.


PART SIX: VALIDATION SCREENS
============================

Screen: Validation Queue

URL path is /validation. Accessible by validators and administrators.

The page title is Validation Queue. The subtitle shows the count of dossiers awaiting review.

Below the title is a filter bar with controls for: search input, process filter dropdown, installer filter dropdown, confidence range slider, and a toggle for Show Priority Only.

The main content shows validation queue cards instead of a table for better scanning. Each card represents one dossier and shows: priority indicator as a colored left border, dossier reference as the card title, beneficiary name and truncated address, process code and name, installer name, confidence score with visual indicator, time waiting showing how long the dossier has been in the queue, and a Start Validation button. Cards are sorted by priority descending then by wait time descending. Cards with critical errors have a red top border.

Clicking Start Validation navigates to the validation detail screen and assigns the dossier to the current user if not already assigned.

Screen: Validation Detail

URL path is /validation/[id]. This is the primary working screen for validators.

The page title shows Validate Dossier followed by the reference number. The subtitle shows the process name and beneficiary name. Action buttons on the right are: Save Progress, Request Documents which opens a dialog, Reject which opens a confirmation dialog, and Approve which opens a confirmation dialog.

The page layout is divided into three vertical sections.

The top section is a fixed header bar showing: dossier reference, status badge, overall confidence percentage, count of issues as X errors and Y warnings, and timer showing how long the validator has been working on this dossier.

The middle section is the main working area divided into two resizable panes.

The left pane is the Document Viewer. At the top is a document selector showing tabs for each document in the dossier: Devis, Facture, AH, CDC, Photos, and any other documents. Each tab shows the document type name and an icon indicating if there are extraction issues with that document. Below the tabs is the document viewer area showing the document as rendered pages. Viewer controls include: zoom slider from 25 percent to 400 percent, fit to width button, fit to height button, rotate buttons, page navigation showing current page and total pages with previous/next buttons, and a fullscreen toggle. The viewer supports pan by dragging and zoom by scrolling. When a field in the right pane is selected, the corresponding region in the document is highlighted with a colored overlay. Multiple documents can be viewed side-by-side using a split view toggle that divides the viewer into two synchronized panes for comparing documents.

The right pane is the Field Review Panel. This pane has its own tabs: Fields, Signatures, and Validation.

The Fields tab shows all extracted fields organized by document. Each document section is collapsible. Within each section, fields are grouped by category. Each field row shows: field label, extracted value in an editable input, confidence indicator as a colored bar, source button that when clicked highlights the source region in the document viewer, and a status indicator. The status indicator is a green check for confirmed values, yellow triangle for values needing review, and red circle for values with errors. Fields with confidence below 85 percent are automatically marked for review. When the validator edits a value, the status changes to show it was manually corrected. A confirmation checkbox appears next to each field that the validator can check to confirm the value is correct. At the top of the fields list is a progress indicator showing X of Y fields confirmed.

The Signatures tab shows signature detection results. Each signature section shows: signature type such as Devis Beneficiary Signature or AH Cadre B Signature, a thumbnail image of the detected signature region, confidence score, and checkboxes for Signature Present and Signature Legible. Below individual signatures is a Signature Comparison section showing all detected signatures side by side with a similarity score between each pair. If signatures appear inconsistent, a warning message is displayed. The validator can mark signatures as verified or flag for investigation.

The Validation tab shows all validation rules and their results. Rules are grouped into three sections: Errors showing failed rules, Warnings showing triggered warnings, and Passed showing successful rules. Each rule row shows: rule name, rule description, status icon, and for failed or warning rules the specific values that triggered the issue. For example, a date consistency error would show the two dates being compared and highlight the discrepancy. Each error or warning has an Override checkbox that allows the validator to override the rule. When override is checked, a required text field appears for entering the justification. Overridden rules are marked with a special indicator. At the bottom of the validation section is a summary showing: rules passed count, rules with warnings count, rules failed count, and rules overridden count.

The bottom section is the Action Bar fixed at the bottom of the screen. The left side shows: dossier reference, time spent on validation, and a Save Progress button. The right side shows: a Comment input field for adding notes, the Reject button which is red, and the Approve button which is green. Between Reject and Approve is a text showing the current validation state such as 2 errors remaining or Ready to approve.

When the validator clicks Reject, a dialog appears asking for the rejection reason. The dialog contains a dropdown for rejection category with options like Missing Documents, Invalid Signatures, Data Inconsistency, and Fraudulent Activity. Below is a text area for detailed explanation. There is also a checkbox for Request Corrected Documents which when checked sends an email to the installer listing required corrections. The dialog has Cancel and Confirm Rejection buttons.

When the validator clicks Approve, a dialog appears showing a summary: fields reviewed count, overrides count if any, and the final status. If there are outstanding warnings that were not addressed, they are listed here. The validator must check a confirmation checkbox acknowledging the warnings before the Approve button becomes active. The dialog has Cancel and Confirm Approval buttons.

After approval or rejection, the validator is returned to the validation queue with a success toast notification.


PART SEVEN: CONFIGURATION SCREENS
=================================

Screen: Process List

URL path is /config/processes. Accessible only by administrators.

The page title is Processes with a subtitle showing the count of configured processes. Action buttons are Import Template and Create Process.

The main content is a list of process cards arranged in a grid with two columns. Each card shows: process code as the card title such as BAR-TH-171, process name as subtitle such as Pompe à chaleur air/eau, status badge showing Active or Inactive or Draft, a metrics row showing document count as X documents and rule count as Y rules and dossier count as Z dossiers, version information, date last updated, and action buttons for Edit and Duplicate and Archive.

Cards for active processes have a green left border. Draft processes have a gray border. Inactive processes have no border and slightly faded appearance.

Above the grid is a filter bar with: search input, category filter dropdown with options for All Categories and CEE Residential and CEE Tertiary and CEE Industrial and Custom, and status filter dropdown with options for All, Active, and Draft.

Clicking Edit navigates to the process configuration screen. Clicking Create Process also navigates to the process configuration screen with a new empty process.

Screen: Process Configuration

URL path is /config/processes/[id] for existing or /config/processes/new for new. Accessible only by administrators.

The page title shows Configure Process for new processes or Edit Process followed by the process code for existing. Action buttons are Save Draft and Preview and Activate. The Activate button is disabled until all required configuration is complete.

The main content is organized as a vertical form with multiple sections, each in its own card.

The first card is Basic Information. This contains the following fields. Code is a text input for the process identifier with validation for uppercase letters, numbers, and hyphens only. For existing processes this field is read-only. Name is a text input for the display name. Category is a dropdown with options for CEE Residential, CEE Tertiary, CEE Industrial, Agriculture, Transport, and Custom. Description is a multi-line text area. Version is a text input for tracking configuration versions. Valid From is a date picker for when this process becomes active. Valid Until is an optional date picker for expiration. Two checkboxes appear: Is Coup de Pouce for enhanced subsidy programs and Is Active for enabling the process.

The second card is Required Documents. This section defines which document types are needed for this process. At the top is an Add Document button. Below is a list of document requirements displayed as draggable rows for reordering. Each row shows: a drag handle, order number, document type name selected from a dropdown of available document types, a required toggle switch, condition field that appears when required is turned off for entering conditional logic such as beneficiary.precarite is not CLASSIQUE, minimum count and maximum count number inputs for document types that can have multiples like photos, a Configure Schema link that opens the schema for this document type, and a remove button. The document type dropdown shows both system document types and custom document types. If the needed document type does not exist, there is a Create New Type link that opens the document type creation dialog.

The third card is Cross-Document Validation Rules. This section defines rules that span multiple documents. At the top is an Add Rule button. Below is a list of configured rules. Each rule row shows: rule name, severity indicator as Error or Warning, documents involved as a list of badges, a toggle for enabled/disabled state, and buttons for Edit and Delete. Clicking Add Rule or Edit opens the rule builder dialog. There is also an Import Standard Rules button that adds commonly used cross-document rules from a template library.

The fourth card is Process-Specific Settings. This section contains additional configuration specific to the process type. For CEE processes this includes: kWh Cumac Calculation Formula as a code editor input, Climate Zone Requirements as checkboxes for H1, H2, H3, Required Certifications as a multi-select for RGE qualifications, and Technical Requirements as a list of equipment specifications.

The fifth card is Workflow Settings. This includes: Auto-approve Threshold as a percentage slider where dossiers above this confidence level can be auto-approved, Priority Rules as a list of conditions that trigger priority flagging, Notification Settings with checkboxes for when to notify installers, and SLA Settings for target processing times.

At the bottom of the page is a sticky action bar with: Cancel button, Save Draft button, Preview button that shows how the process will appear in the upload flow, and Activate button.

Screen: Document Type List

URL path is /config/document-types. Accessible only by administrators.

The page title is Document Types with subtitle showing the count. Action buttons are Import and Create Document Type.

The main content is a data table with columns: Code, Name, Category, Fields Count, Rules Count, System showing a badge for system-defined types that cannot be deleted, Status, and Actions. System document types like Devis and Facture and AH have the System badge and can be customized but not deleted. Custom document types can be fully managed.

Above the table are filters for search input, category dropdown, and system/custom toggle.

Clicking a row or the Edit action navigates to the document type configuration screen.

Screen: Document Type Configuration

URL path is /config/document-types/[id] or /config/document-types/new. Accessible only by administrators.

The page title shows Configure Document Type or the document type name for existing types. Action buttons are Save and for custom types Delete.

The main content is organized into tabbed sections.

The first tab is General. This contains: Code as text input, Name as text input, Description as text area, Category dropdown with options for Commercial Documents, Legal Documents, Administrative Documents, Technical Documents, and Photos, Classification Hints as a tag input where administrators enter keywords that help the AI classify documents such as Devis and Quote and Proposition, Expected Page Range with minimum and maximum number inputs, and Active toggle.

The second tab is Field Schema. This is the main configuration area for defining what data to extract from this document type. At the top is a toolbar with: Add Field button, Add Field Group button for organizing fields, Import Fields From dropdown to copy fields from another document type, and Export Schema button. Below is the field list displayed as an accordion where each field can be expanded for editing.

Each field in the collapsed state shows: drag handle for reordering, field name, data type badge, required indicator, and expand/collapse toggle.

When expanded, each field shows an editing form with the following inputs. Internal Name is the field identifier used in rules and data export, using snake_case format. Display Name is the human-readable label shown in the UI. Data Type is a dropdown with options: String for general text, Integer for whole numbers, Decimal for numbers with decimals, Currency for monetary amounts, Date for dates, Boolean for yes/no values, Email for email addresses, Phone for phone numbers, Address for postal addresses, Enum for predefined options, and Signature for signature detection regions. Based on the selected data type, additional options appear. For String: maximum length, validation regex pattern. For Integer and Decimal: minimum and maximum values. For Currency: currency symbol default of euro. For Date: expected format default of DD/MM/YYYY. For Enum: a list editor for defining allowed values. For Signature: no additional options but enables signature detection logic.

Additional field properties include: Required checkbox, Extraction Hints as a tag input for keywords that help locate this field in documents such as Prime CEE or Prime énergie, Post-Processing as checkboxes for Uppercase and Lowercase and Trim Whitespace and Remove Special Characters, Field Group dropdown to organize fields into logical groups like Identification or Financial or Technical, Cross-Reference Fields as a multi-select for selecting fields in other document types that should match this field such as linking devis.prime_cee to facture.prime_cee and cdc.prime_montant, and Confidence Threshold as a slider setting the minimum confidence for auto-acceptance with default of 85 percent.

At the bottom of each field is a Delete Field button with confirmation.

Below the field list is a schema preview section showing the JSON representation of the field schema in a read-only code viewer.

The third tab is Document Rules. This shows validation rules specific to this document type. The interface is similar to the cross-document rules in the process configuration but scoped to this document's fields only. Each rule row shows: rule name, condition expression, severity, and toggle. The Add Rule button opens the rule builder dialog pre-configured for this document type's fields.

The fourth tab is Preview. This tab shows a sample document with the configured schema overlaid. Administrators can upload a test document and run extraction to see how the schema performs. The preview shows the document viewer on the left and extracted fields on the right with confidence scores. This allows testing and refinement before deploying schema changes.

Screen: Validation Rules List

URL path is /config/rules. Accessible only by administrators.

The page title is Validation Rules with a subtitle showing the count of configured rules. Action buttons are Import Rules and Create Rule.

Below the title are tabs for filtering: All Rules, Document Rules, Cross-Document Rules, and Global Rules.

The main content is a data table with columns: Code as the rule identifier, Name, Type showing Document or Cross-Document or Global, Severity showing Error or Warning badge, Applies To showing document types or processes as badge lists, Status toggle that can be switched directly in the table, and Actions menu.

Above the table are filters for: search input, severity dropdown, status dropdown, and applies to filter for selecting specific documents or processes.

The Actions menu contains: Edit, Duplicate, Test Rule which opens a testing dialog, View Usage which shows where this rule is applied, and Disable/Enable toggle.

Clicking Edit or Create Rule opens the rule builder screen.

Screen: Rule Builder

URL path is /config/rules/[id] or /config/rules/new. Accessible only by administrators.

The page title shows Create Validation Rule or Edit Rule followed by the rule code. Action buttons are Test Rule and Save.

The main content is a form with the following sections.

The first section is Rule Information. This contains: Code as text input for unique identifier, Name as text input for display name, Description as text area explaining what the rule checks, Type dropdown with options Document Rule and Cross-Document Rule and Global Rule, Severity dropdown with options Error and Warning and Info, and Auto-Reject toggle that when enabled causes dossiers failing this rule to be automatically rejected without human review.

The second section is Scope. For Document Rules this shows a dropdown to select which document type this rule applies to. For Cross-Document Rules this shows a multi-select for choosing which document types are involved in the rule. For Global Rules this shows a note that the rule applies to all dossiers. Additionally there is an Applies to Processes setting that can be set to All Processes or specific processes selected from a multi-select.

The third section is Condition Builder. This has two modes toggled by a switch: Visual Builder and Expression Editor.

In Visual Builder mode, the interface shows a graphical rule construction tool. The builder shows condition rows that can be added and grouped. Each condition row has: a field selector dropdown that lists all fields from the selected document types organized by document, an operator dropdown with options varies by field type including equals and not equals and greater than and less than and contains and starts with and matches pattern and is empty and is not empty, a value input that can be a literal value or a reference to another field, and a remove button. Between condition rows are AND/OR toggles for combining conditions. Conditions can be grouped with parentheses using an Add Group button. The visual builder generates the expression code which is shown in a read-only preview below.

In Expression Editor mode, a code editor is shown where administrators can directly write rule expressions using the rule expression language. The editor has syntax highlighting and autocomplete for field names and functions. A reference panel on the right shows available fields from selected documents and available functions with their signatures.

The fourth section is Error Message. This contains a text input for the message shown when the rule fails. The message can include field references in curly braces that will be replaced with actual values, such as The prime CEE on the devis of {devis.prime_cee} does not match the facture amount of {facture.prime_cee}.

The fifth section is Testing. This shows a test interface where administrators can input sample data values and see if the rule would pass or fail. The test panel has: input fields for each field referenced in the condition, a Run Test button, and a result display showing Pass or Fail with the evaluated message.

At the bottom is a sticky action bar with Cancel, Save Draft, and Save and Activate buttons.

Screen: Field Schema Library

URL path is /config/schemas. Accessible only by administrators.

The page title is Field Schema Library with subtitle explaining this is a reference of all field schemas across document types.

The main content shows a searchable, filterable view of all fields across all document types. This helps identify reuse opportunities and ensure consistency.

The table columns are: Field Name, Display Name, Document Type, Data Type, Required, Cross-References showing linked fields, and Usage Count showing how many dossiers have this field populated.

Filters include: search input, document type filter, data type filter, and a toggle for Show Cross-Referenced Only.

Clicking a field row opens a detail dialog showing the full field configuration and a link to edit it in the document type configuration.


PART EIGHT: USER AND INSTALLER MANAGEMENT
=========================================

Screen: User List

URL path is /users. Accessible only by administrators.

The page title is Users with subtitle showing the count. Action button is Add User.

The main content is a data table with columns: Name, Email, Role showing Administrator or Validator badge, Status showing Active or Inactive, Last Login showing date and time, Created showing date, and Actions.

Above the table are filters for search input, role dropdown, and status dropdown.

The Actions menu contains: Edit, Reset Password which sends a reset email, Deactivate/Activate toggle, and for inactive users Delete.

Clicking Add User or Edit opens a dialog with the user form.

The user form dialog contains: Name text input, Email text input with validation, Role dropdown with Administrator and Validator options, Active toggle, and for new users a checkbox for Send welcome email with login instructions. For existing users there is a Reset Password button that sends a reset email.

Screen: Installer List

URL path is /installers. Accessible by administrators and validators.

The page title is Installers with subtitle showing the count. Action button is Add Installer.

The main content is a data table with columns: Company Name, SIRET showing the 14-digit identifier, Contact Name, Contact Email, RGE Status showing a badge for Valid or Expired or Not Verified, Active Dossiers count, Total Dossiers count, Status, and Actions.

Above the table are filters for search input, RGE status dropdown, and active status toggle.

Clicking a row navigates to the installer detail screen. The Actions menu contains Edit and View Dossiers and Deactivate.

Screen: Installer Detail

URL path is /installers/[id]. Accessible by administrators and validators.

The page title shows the company name. Action buttons are Edit and View Contract.

The content is organized into cards.

The first card is Company Information showing: Company Name, SIRET, SIREN derived from SIRET, Address on multiple lines, and Status toggle.

The second card is Contact Information showing: Primary Contact Name, Email, Phone, and Secondary Contact if provided.

The third card is Certifications showing: RGE Number, RGE Valid Until with warning if expiring soon or error if expired, Qualification Types as a list of certifications, and Verification Status with date last verified.

The fourth card is Contract Details showing: Contract Reference, Contract Start Date, Contract End Date if applicable, Volume Commitment in GWh cumac, Price per kWh for standard tier, Price per kWh for precarity tier, Payment Terms, and a View Contract PDF button.

The fifth card is Dossier Statistics showing: Total Dossiers Submitted, Approved Count with percentage, Rejected Count with percentage, Pending Count, Average Processing Time, and a link to View All Dossiers filtered to this installer.

The sixth card is Recent Dossiers showing a compact table of the ten most recent dossiers from this installer with columns for Reference, Beneficiary, Status, and Date.

Screen: Add/Edit Installer

URL path is /installers/new or accessed via edit action. This can be a full page or a large dialog.

The form contains sections for Company Information with fields for Company Name, SIRET with validation, Address, City, and Postal Code. Contact Information section has fields for Contact Name, Email, and Phone. Certification section has fields for RGE Number, RGE Valid Until date picker, and Qualification Types multi-select. Contract section has fields for Contract Reference, Volume GWh cumac, Standard Price per kWh, Precarity Price per kWh, and Contract Document file upload.

The form has validation rules: SIRET must be 14 digits and unique, Email must be valid format, RGE Valid Until must be in the future for new installers.


PART NINE: INSTALLER PORTAL SCREENS
===================================

Screen: Installer Dossier List

URL path is /my-dossiers. This is the installer's view of their dossiers.

The page title is My Dossiers with subtitle showing the count.

The main content is a data table with columns: Reference, Beneficiary Name, Operation showing the process type, Status with colored badge, Submitted Date, and Actions with View button.

Above the table are filters for search input, status dropdown with options All, Draft, Processing, Awaiting Review, Approved, Rejected, and Paid, and date range picker.

Status badges use the following colors: Draft is gray, Processing is blue, Awaiting Review is yellow, Approved is green, Rejected is red, and Paid is purple.

Clicking View navigates to the installer's read-only dossier view.

Screen: Installer Dossier View

URL path is /my-dossiers/[id]. This is a read-only view for installers.

The page title shows the dossier reference. The subtitle shows the status badge and process name.

The content is organized into cards similar to the validator dossier view but without edit capabilities.

The first card is Status with a large status indicator and timeline showing key milestones: Submitted, Processing Complete, Validation Complete, and Payment Initiated. Completed steps show checkmarks with dates. The current step is highlighted.

The second card is Beneficiary Information showing the extracted beneficiary details.

The third card is Documents showing the list of uploaded documents with Preview and Download buttons. Documents cannot be modified after submission.

The fourth card is Extracted Data showing key fields that were extracted, presented in a clean read-only format grouped by category.

The fifth card is Validation Result. For approved dossiers this shows an Approved message with the approval date and any notes. For rejected dossiers this shows a Rejected message with the rejection reason and a list of Required Corrections. Each correction item shows what needs to be fixed. There is a Submit Corrected Documents button that navigates to an upload interface where the installer can upload replacement documents.

The sixth card is Billing Information which appears only for approved dossiers. This shows the prime amount, payment status, expected payment date, and payment reference when paid.

Screen: New Dossier Upload

URL path is /upload. This is the installer's document upload flow.

The page shows a multi-step wizard with a progress indicator at the top showing the steps: Select Operation, Upload Documents, Review, and Submit.

Step One: Select Operation

The content shows a search and filter interface for selecting the CEE operation type. At the top is a search input for filtering operations. Below are category tabs: All, Residential, Tertiary, Industrial. The main area shows operation cards in a grid. Each card shows the operation code, operation name, and a brief description. Clicking a card selects it and shows a checkmark. Below the grid, the selected operation is confirmed with a summary showing: Operation Code, Operation Name, and Required Documents as a bulleted list. A Next button proceeds to step two.

Step Two: Upload Documents

The content shows the required documents list with upload areas. Each document type required for the selected process is shown as a section. Each section shows: document type name such as Devis, requirement indicator as Required or Optional or Conditional, description of what this document should contain, upload area that can receive drag and drop or click to browse, accepted formats as PDF, JPG, PNG, and maximum file size. When a file is uploaded, the upload area changes to show: file icon, filename, file size, a progress bar during upload, and when complete a green checkmark. Each uploaded file has a Remove button to delete and re-upload.

For document types that allow multiples like photos, there is an Add Another button that creates additional upload slots.

A checklist at the bottom shows upload progress: X of Y required documents uploaded. The Next button is disabled until all required documents are uploaded.

Step Three: Review

The content shows a summary for review before submission. The Beneficiary Information section has input fields for: Name, Address, City, Postal Code, Email, and Phone. These fields are optional as the AI will extract this information, but providing them helps with accuracy. The Documents section shows a list of all uploaded documents with thumbnail previews and document type labels. Each document has an option to re-upload if needed. The Review Checklist shows confirmation checkboxes for: I confirm all documents are legible, I confirm the beneficiary information is correct, I understand the documents will be verified. The Submit button is disabled until all checkboxes are checked.

Step Four: Confirmation

After submission, the content shows a success message with: a checkmark icon, the new dossier reference number prominently displayed, a message explaining what happens next such as Your documents are being processed. You will receive a notification when validation is complete., estimated processing time, and buttons for Upload Another Dossier and View My Dossiers.


PART TEN: BILLING SCREENS
=========================

Screen: Billing Dashboard

URL path is /billing. Accessible by administrators and validators.

The page title is Billing with subtitle showing the period such as November 2025.

Below the title are period navigation controls: Previous and Next month buttons and a month/year picker.

The first section shows Billing Summary cards in a row. The cards are: Ready to Bill showing count and total amount of approved dossiers awaiting billing action, Billed This Month showing count and amount, Paid This Month showing count and amount, and Outstanding showing count and amount of billed but unpaid dossiers.

The second section is Ready to Bill table showing approved dossiers that have not been billed. Columns are: checkbox for selection, Reference, Beneficiary, Installer, Process, Approved Date, Prime Amount, and Actions with Bill button. Bulk actions allow selecting multiple dossiers and clicking Generate Invoices to create invoices for multiple dossiers at once grouped by installer.

The third section is Recent Billing Activity showing a table of recent billing actions with columns: Reference, Installer, Amount, Action showing Billed or Paid, Date, and User who performed the action.

Screen: Dossier Billing Detail

URL path is /billing/[id]. Accessible by administrators and validators.

The page title shows Billing for Dossier followed by the reference. Action buttons vary by status: for unbilled dossiers there is a Generate Invoice button, for billed dossiers there is a Mark as Paid button.

The first card is Dossier Summary showing: Reference, Beneficiary Name and Address, Process Code and Name, Installer Name as a link, Approved Date, and Approved By.

The second card is CEE Calculation showing the breakdown: Operation Code, Climate Zone, Heated Surface in square meters, Building Type, Replaced Energy Source, Precarity Status, a separator line, kWh Cumac Calculated, Price per kWh, another separator line, and Prime CEE Total as the calculated amount.

The third card is Payment Breakdown showing how the prime is distributed: Total Prime Amount, Payment on Validation showing 90 percent amount, Payment on EMMY Delivery showing 10 percent amount, and Payment Terms such as 15 days from invoice.

The fourth card is Installer Information showing: Company Name, SIRET, Contact Name, Contact Email, Contract Reference, and Contract Pricing.

The fifth card is Invoice Status showing: Invoice Number if generated, Invoice Date, Due Date, Payment Status, Payment Date if paid, and Payment Reference if paid. There is a Download Invoice PDF button if the invoice has been generated.

The sixth card is Communication Log showing a timeline of billing-related communications: invoice generated, invoice sent, payment reminders, payment received. Each entry shows the date, action, and user.

When the Generate Invoice button is clicked, a dialog appears showing a preview of the invoice with options to: adjust the invoice date, add notes to the invoice, and confirm generation. After confirmation, the invoice PDF is generated and stored, the status updates to Billed, and options appear to email the invoice to the installer.

When the Mark as Paid button is clicked, a dialog appears with fields for: Payment Date, Payment Reference, Payment Method dropdown with options Bank Transfer, Check, and Other, and optional Notes. After confirmation, the status updates to Paid.


PART ELEVEN: ANALYTICS AND REPORTING
====================================

Screen: Analytics Dashboard

URL path is /analytics. Accessible by administrators.

The page title is Analytics with a date range picker for selecting the analysis period.

The first section shows Key Metrics as large number displays with trend indicators: Total Dossiers Processed, Approval Rate percentage, Average Processing Time, AI Accuracy Rate showing how often AI extraction matches final validated values, and Rejection Rate.

The second section shows Dossiers Over Time as a line chart. The x-axis shows dates, the y-axis shows dossier count. Multiple lines show: submitted, approved, and rejected. The chart is interactive with hover tooltips showing exact values.

The third section shows Processing Time Distribution as a histogram. The x-axis shows time ranges in hours, the y-axis shows dossier count. This helps identify bottlenecks.

The fourth section shows Accuracy by Document Type as a bar chart. Each bar represents a document type with the extraction accuracy percentage. This identifies which document types need schema improvement.

The fifth section shows Validation Rule Performance as a table listing: Rule Name, Times Evaluated, Passed Count and Percentage, Failed Count and Percentage, Override Count and Percentage. Rules with high override rates may need adjustment.

The sixth section shows Performance by Installer as a table with columns: Installer Name, Dossiers Submitted, Approval Rate, Average Issues per Dossier, and Trend arrow. This identifies installers who may need training or have quality issues.

The seventh section shows Validator Performance as a table with columns: Validator Name, Dossiers Validated, Average Time per Dossier, Accuracy Rate compared to final outcomes, and Overrides Made.

Each section has an Export button to download the data as CSV.

Screen: Activity Log

URL path is /activity. Accessible by administrators.

The page title is Activity Log with filters for date range, user, and event type.

The main content is a table showing system events with columns: Timestamp, User, Event Type showing a badge, Description, and Details button. Event types include: Dossier Created, Document Uploaded, Dossier Validated, Dossier Approved, Dossier Rejected, Configuration Changed, User Login, and User Logout.

Clicking Details opens a dialog showing the full event data including any changed values for configuration events.

The table supports infinite scroll or pagination for navigating large volumes of events.


PART TWELVE: SETTINGS SCREENS
=============================

Screen: General Settings

URL path is /settings. Accessible by administrators.

The page title is Settings with tabs for different setting categories.

The first tab is General with sections for: Application Name text input, Logo upload area, Primary Color picker for branding, Default Language dropdown, and Timezone dropdown.

The second tab is Notifications with settings for email notifications. Each notification type has a toggle to enable/disable and a template editor. Notification types include: Dossier Submitted sent to validators, Dossier Approved sent to installers, Dossier Rejected sent to installers, Correction Requested sent to installers, Payment Reminder sent to installers, and Daily Summary sent to administrators.

The third tab is Processing with settings for: Default Confidence Threshold slider, Auto-Assignment Rules for distributing dossiers to validators, Processing Queue Priority Rules, and Retry Settings for failed AI processing.

The fourth tab is Integrations with configuration for external services: Gemini API Key input with masked display, Storage Settings for MinIO configuration, Email Service Settings for SMTP configuration, and Webhook URLs for external system notifications.

The fifth tab is Security with settings for: Session Timeout duration, Password Policy options for minimum length and complexity requirements, Two-Factor Authentication toggle for requiring 2FA, and IP Allowlist for restricting access.

Each tab has a Save Changes button at the bottom.

Screen: Profile Settings

URL path is /settings/profile. Accessible by all users.

The page title is My Profile.

The first section is Personal Information with fields: Name, Email as read-only, Phone optional, and Profile Photo upload.

The second section is Password with current password input, new password input with strength indicator, confirm new password input, and Update Password button.

The third section is Notification Preferences with toggles for: Email notifications for my dossiers, Daily summary email, Browser notifications, and Sound alerts.

The fourth section is Two-Factor Authentication with setup or disable options. If not enabled, there is a Setup 2FA button that starts the TOTP setup flow. If enabled, there is a Disable 2FA button with password confirmation.

The fifth section is Sessions showing a list of active sessions with: device/browser info, IP address, location if available, last activity time, and a Revoke button for each session except the current one. There is also a Revoke All Other Sessions button.


PART THIRTEEN: COMPONENT SPECIFICATIONS
=======================================

Component: Document Viewer

This component is used throughout the application for viewing uploaded documents.

The viewer container has a dark gray background to provide contrast for documents. At the top is a toolbar with: document name display, zoom controls as minus button, percentage dropdown, and plus button, fit controls as Fit Width and Fit Height buttons, rotation buttons for rotate left and rotate right, page navigation as Previous button, page number input showing current of total, and Next button, and display mode controls as Single Page, Continuous Scroll, and Side by Side buttons.

The main viewing area shows the document pages rendered at the current zoom level. In single page mode, one page is shown at a time with navigation to move between pages. In continuous scroll mode, all pages are shown vertically with smooth scrolling. In side by side mode, two pages are shown horizontally for comparing.

The viewer supports mouse interaction for panning by clicking and dragging when zoomed in, and zooming by scrolling with the mouse wheel while holding Control key.

When field highlighting is active, colored overlays appear on the document showing where specific fields were extracted. Each overlay has a subtle background color and border matching the field category. Hovering over an overlay shows a tooltip with the field name and extracted value.

For image documents like photos, the viewer shows the image scaled to fit with zoom capabilities. For multi-page PDFs, pages are rendered progressively as the user navigates.

Component: Field Editor

This component is used in the validation screen for reviewing and editing extracted values.

Each field editor instance shows: the field label, the extracted value in an editable input appropriate to the field type such as text input or date picker or number input or dropdown for enum types, a confidence indicator as a small colored bar where green is above 90 percent, yellow is 70 to 90 percent, and red is below 70 percent, a source button that when clicked highlights the source region in the document viewer and scrolls to that location, a status indicator showing unreviewed or confirmed or corrected, and for fields that have been edited an undo button to restore the original value.

When a field is edited, the input border changes color to indicate the value has been modified. The status changes from unreviewed to corrected. The original value is preserved so it can be restored.

For fields with low confidence, the background is slightly highlighted to draw attention. For fields with validation errors, the background is tinted red.

Component: Rule Builder

This component is used for creating and editing validation rules with a visual interface.

The builder has two main areas: the condition construction area and the preview area.

In the condition construction area, rules are built as a tree of conditions. Each node in the tree is either a condition or a group. A condition node shows: field selector as a cascading dropdown showing document type then field name, operator selector with options based on field type, and value input which can be a literal value or a field reference. A group node shows: group type as AND or OR, and contains child nodes which can be conditions or nested groups. Nodes have buttons to add a sibling condition, add a sibling group, and delete the node.

The preview area shows the generated rule expression as code. This updates in real time as the visual builder is modified. There is also a toggle to switch to expression editor mode where the code can be edited directly.

Below both areas is a test section where sample values can be entered to test if the rule passes or fails.

Component: Signature Comparison

This component is used in the validation screen signatures tab.

The component shows signature images from multiple documents arranged in a grid. Each signature cell shows: the document source as a label such as Devis or AH Cadre B, the signature image cropped from the document, a confidence score for signature detection, and checkboxes for Signature Present and Signature Clear.

Below the grid is a similarity matrix showing the comparison between each pair of signatures. Each cell in the matrix shows the similarity percentage. Cells are colored: green for high similarity above 85 percent, yellow for moderate similarity between 70 and 85 percent, and red for low similarity below 70 percent.

If any pairs have low similarity, a warning message is displayed explaining that signatures may not match.

Component: Process Flow Diagram

This component is used to visualize the document requirements and validation flow for a process.

The diagram shows document types as rectangular nodes connected by arrows indicating the validation flow and cross-document relationships.

Each document node shows: the document type icon, document type name, required/optional indicator, and small badges for field count and rule count.

Arrows between nodes are labeled with the cross-document rule that links them, such as prime_cee must match.

The diagram is interactive: clicking a node opens the document type configuration, clicking an arrow opens the rule configuration.

Component: KPI Card

This component is used on dashboards to display key metrics.

Each card shows: an icon representing the metric category, the metric name as a label, the main value as a large number, a comparison value showing change from previous period with up or down arrow and percentage, and a subtle background color indicating if the trend is positive or negative.

Cards are clickable and navigate to detailed views related to that metric.

Component: Status Badge

This component is used throughout to display dossier and document status.

Each badge shows text on a colored background. The colors are: gray for Draft and Inactive and Unassigned, blue for Processing and In Progress, yellow for Awaiting Review and Pending and Warning, green for Approved and Active and Verified and Passed, red for Rejected and Error and Failed and Expired, and purple for Billed and Paid and Complete.

Badges have consistent sizing and rounded corners for visual consistency.

Component: Confidence Indicator

This component is used to display AI confidence scores.

The indicator shows a horizontal bar divided into segments. The bar is filled to the percentage of confidence. The color varies: green for 90 to 100 percent, yellow for 70 to 89 percent, red for 0 to 69 percent.

Next to the bar is the percentage value as text.

For compact displays, only the colored bar is shown without text. For detailed displays, the bar includes tick marks at 70 and 90 percent thresholds.

Component: Timeline

This component is used to display chronological events for dossiers.

The timeline shows a vertical line with event nodes positioned along it. Each event node shows: a colored dot on the timeline where green indicates success, red indicates failure, blue indicates information, the event title, timestamp in relative format like 2 hours ago with full date on hover, the user who performed the action, and optional additional details as expandable text.

The most recent event is at the top. Events can be filtered by type using tabs or a dropdown.

Component: File Upload Area

This component is used for uploading documents.

The upload area shows a dashed border box with: an upload icon in the center, text reading Drag and drop files here or click to browse, a note showing accepted formats and maximum file size.

The area changes appearance on drag over to indicate it will accept the drop. When files are dropped or selected, they appear in a list below the drop zone showing: file icon, filename, file size, upload progress bar, and when complete a success checkmark with remove button.

For validation, files that are too large or wrong format show an error message and are not uploaded.


PART FOURTEEN: ERROR HANDLING AND EDGE CASES
============================================

Error: Network Connectivity Lost

When the application loses network connectivity, a banner appears at the top of the screen with a red background showing message Network connection lost. Reconnecting... Actions that require network access are disabled. When connectivity is restored, the banner changes to green showing Connection restored and then fades away.

Error: Session Expired

When the user's session expires, a dialog appears over the current page with message Your session has expired. Please log in again. The dialog has a single Log In button that navigates to the login page. The current URL is preserved so the user can return after logging in.

Error: Unauthorized Access

When a user attempts to access a page they do not have permission for, they are redirected to an Access Denied page showing: a lock icon, message You do not have permission to access this page, and a Return to Dashboard button.

Error: Resource Not Found

When a user navigates to a page for a resource that does not exist such as a deleted dossier, a Not Found page is shown with: a search icon, message The requested resource was not found, and buttons for Go Back and Return to Dashboard.

Error: Form Validation

When a user submits a form with validation errors, the form does not submit and: invalid fields are highlighted with red borders, error messages appear below invalid fields explaining the issue, and a summary error alert appears at the top of the form listing all errors. The page scrolls to the first error.

Error: File Upload Failure

When a file upload fails, the file in the upload list shows a red error state with: an error icon, the error message such as File too large or Upload failed, and a Retry button.

Error: AI Processing Failure

When AI processing fails for a document, the document status shows Processing Failed. The dossier detail view shows an alert explaining the issue. Options are provided to: Retry Processing which resubmits to the AI service, or Manual Entry which allows validators to manually enter the extracted data.

Edge Case: Concurrent Editing

When two users attempt to edit the same configuration simultaneously, the second user to save sees a conflict dialog with message This record has been modified by another user. The dialog shows the other user's changes and provides options to: Overwrite which saves their changes discarding the other user's work, Merge which attempts to combine changes, or Cancel which discards their changes.

Edge Case: Large File Processing

When a user uploads a very large file, a progress indicator shows the upload percentage. For files that take more than 30 seconds to process, a message appears explaining Processing may take a few minutes for large files. You can navigate away and check back later.

Edge Case: Incomplete Dossier

When a dossier is missing required documents, it cannot be submitted for validation. The submit button is disabled and a message lists the missing documents.


PART FIFTEEN: RESPONSIVE BEHAVIOR
=================================

Breakpoints

The application uses three breakpoints: desktop for screens 1280 pixels and wider, tablet for screens 768 to 1279 pixels, and mobile for screens below 768 pixels.

Desktop Layout

On desktop, the full layout is displayed with persistent sidebar navigation on the left taking 250 pixels width, and the main content area filling the remaining width. Data tables show all columns. Split view components like the validation screen show both panes side by side.

Tablet Layout

On tablet, the sidebar collapses to show only icons taking 60 pixels width. The full sidebar can be opened by clicking a menu button and slides out as an overlay. Data tables hide less important columns and show them in expandable row details. Split view components show panes in a tabbed interface instead of side by side.

Mobile Layout

On mobile, the sidebar is completely hidden and accessed via a hamburger menu that opens a full-screen overlay. The header is simplified to show only essential elements. Data tables are replaced with card-based lists where each row becomes a card showing key information with tap to expand for details. Forms are displayed in single column layouts. Dialogs become full-screen modals. The validation screen shows document viewer and field editor as separate tabbed views.


END OF DOCUMENT
