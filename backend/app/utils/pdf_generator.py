import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from backend.app.config import settings

def generate_claim_pdf_report(claim_data: dict, output_path: str = None) -> str:
    claim_id = claim_data.get("claim_id", "CLM-UNKNOWN")
    if not output_path:
        output_path = os.path.join(settings.REPORTS_DIR, f"Claim_Audit_Report_{claim_id}.pdf")

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f2942"),
        alignment=1 # Center
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        alignment=1
    )
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f2942"),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1e293b")
    )
    badge_pass = ParagraphStyle('PassBadge', parent=styles['Normal'], fontSize=8, leading=10, textColor=colors.HexColor("#059669"), fontName="Helvetica-Bold")
    badge_warn = ParagraphStyle('WarnBadge', parent=styles['Normal'], fontSize=8, leading=10, textColor=colors.HexColor("#d97706"), fontName="Helvetica-Bold")
    badge_fail = ParagraphStyle('FailBadge', parent=styles['Normal'], fontSize=8, leading=10, textColor=colors.HexColor("#dc2626"), fontName="Helvetica-Bold")

    elements = []

    # Title & Header
    elements.append(Paragraph("<b>CLAIMGUARD INSURANCE AUDIT REPORT</b>", title_style))
    elements.append(Paragraph("Provider Claim Denial Prevention & 16-Factor Pre-Submission Verification", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0d9488"), spaceAfter=12))

    # Summary Matrix Table
    patient_name = claim_data.get("patient_name", "N/A")
    pol_num = claim_data.get("policy_number", "N/A")
    diagnosis = claim_data.get("disease_diagnosis", "N/A")
    treatment = claim_data.get("treatment_procedure", "N/A")
    claim_amt = claim_data.get("claim_amount", 0.0)
    est_claimable = claim_data.get("estimated_claimable_amount", 0.0)
    conf_score = claim_data.get("confidence_score", 0.0)
    risk_level = claim_data.get("risk_level", "LOW")
    status = claim_data.get("status", "Claim Ready")

    summary_data = [
        [
            Paragraph("<b>Claim ID:</b>", body_style), Paragraph(f"<b>{claim_id}</b>", body_style),
            Paragraph("<b>Generated Date:</b>", body_style), Paragraph(datetime.utcnow().strftime("%d-%m-%Y %H:%M UTC"), body_style)
        ],
        [
            Paragraph("<b>Patient Name:</b>", body_style), Paragraph(patient_name, body_style),
            Paragraph("<b>Policy Number:</b>", body_style), Paragraph(pol_num, body_style)
        ],
        [
            Paragraph("<b>Diagnosis:</b>", body_style), Paragraph(diagnosis, body_style),
            Paragraph("<b>Treatment:</b>", body_style), Paragraph(treatment, body_style)
        ],
        [
            Paragraph("<b>Requested Amount:</b>", body_style), Paragraph(f"₹{claim_amt:,.2f}", body_style),
            Paragraph("<b>Est. Claimable:</b>", body_style), Paragraph(f"<b>₹{est_claimable:,.2f}</b>", body_style)
        ],
        [
            Paragraph("<b>Confidence / Denial Chance:</b>", body_style), Paragraph(f"<b>{conf_score:.1f}% ({max(0.0, 100.0 - conf_score):.1f}% Denial Chance)</b>", body_style),
            Paragraph("<b>Submission Status:</b>", body_style), Paragraph(f"<b>{status} ({risk_level} RISK)</b>", body_style)
        ]
    ]

    summary_table = Table(summary_data, colWidths=[110, 160, 110, 160])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    # 16-Factor Validation Table
    elements.append(Paragraph("<b>16-Factor Validation Audit Matrix</b>", h2_style))
    
    val_header = [Paragraph("<b>#</b>", body_style), Paragraph("<b>Validation Factor</b>", body_style), Paragraph("<b>Status</b>", body_style), Paragraph("<b>Audit Findings & Details</b>", body_style)]
    val_rows = [val_header]

    validations = claim_data.get("validations", [])
    for v in validations:
        num = v.get("factor_number", "")
        name = v.get("factor_name", "")
        st = v.get("status", "PASS")
        msg = v.get("message", "")

        if st == "PASS":
            badge = Paragraph("✓ PASS", badge_pass)
        elif st == "WARNING":
            badge = Paragraph("⚠ WARN", badge_warn)
        else:
            badge = Paragraph("✗ FAIL", badge_fail)

        val_rows.append([
            Paragraph(str(num), body_style),
            Paragraph(name, body_style),
            badge,
            Paragraph(msg, body_style)
        ])

    val_table = Table(val_rows, colWidths=[25, 175, 60, 280])
    val_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f2942")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(val_table)
    elements.append(Spacer(1, 14))

    # Actionable Recommendations
    recommendations = claim_data.get("recommendations", [])
    if recommendations:
        elements.append(Paragraph("<b>Actionable Denial Prevention Recommendations</b>", h2_style))
        rec_data = [[Paragraph("<b>Severity</b>", body_style), Paragraph("<b>Detected Issue</b>", body_style), Paragraph("<b>Recommended Corrective Action</b>", body_style)]]
        for r in recommendations:
            sev = r.get("severity", "HIGH")
            title = r.get("issue_title", "")
            action = r.get("recommended_action", "")
            badge = Paragraph(f"<b>{sev}</b>", badge_fail if sev == "HIGH" else badge_warn)
            rec_data.append([badge, Paragraph(title, body_style), Paragraph(action, body_style)])

        rec_table = Table(rec_data, colWidths=[65, 185, 290])
        rec_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(rec_table)
        elements.append(Spacer(1, 14))

    # Footer disclaimer
    disclaimer = ("<b>Notice:</b> This pre-submission validation report is generated based on configured policy rules "
                  "for claim denial prevention. It does not constitute a legal approval guarantee.")
    elements.append(Paragraph(disclaimer, subtitle_style))

    doc.build(elements)
    return output_path
