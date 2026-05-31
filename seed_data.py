"""Seed data script with 100 AI compliance prompts for Australian RTOs."""

import uuid
from datetime import datetime, timezone

PROMPT_TEMPLATES = [
    # ============ Compliance & Regulatory ============
    ("What are the requirements for maintaining trainer competency records under the Standards for RTOs 2015?", "compliance", True),
    ("Explain the audit evidence requirements for USI verification in vocational education.", "compliance", True),
    ("What documentation is required when an RTO engages subcontractors?", "compliance", True),
    ("How should an RTO handle a complaint that involves assessment decisions?", "compliance", True),
    ("What are the requirements for marketing and advertising compliance?", "compliance", True),
    ("Describe the record-keeping obligations for RTOs under the NVAF framework.", "compliance", True),
    ("What are the essential conditions for trainer qualification verification?", "compliance", True),
    ("How does an RTO demonstrate industry engagement for training package implementation?", "compliance", True),
    ("What constitutes sufficient evidence of learner progress?", "compliance", True),
    ("Explain the requirements for assessment validation under Clauses 1.8-1.12 of the Standards.", "compliance", True),
    
    # ============ Training Package Implementation ============
    ("How should an RTO implement a new training package release?", "training_packages", True),
    ("What is the process for customizing training packages for specific client needs?", "training_packages", True),
    ("Explain the requirements for delivery of clustered units of competency.", "training_packages", True),
    ("What are the rules around recognition of prior learning (RPL) across training packages?", "training_packages", True),
    ("How do you map enterprise credentials to nationally recognized qualifications?", "training_packages", True),
    ("What documentation supports training package transition for superseded qualifications?", "training_packages", True),
    ("Explain the requirements for foundation skills assessment integration.", "training_packages", True),
    ("How should an RTO handle volume of learning requirements for distance delivery?", "training_packages", True),
    ("What are the requirements for workplace evidence collection in assessment?", "training_packages", True),
    ("Explain the rules for credit transfer and articulation arrangements.", "training_packages", True),
    
    # ============ Assessment Practices ============
    ("What constitutes valid assessment evidence under the Standards?", "assessment", True),
    ("How should an RTO conduct competency-based assessment for practical skills?", "assessment", True),
    ("Explain the requirements for assessor competency and currency.", "assessment", True),
    ("What are the rules for third-party assessment arrangements?", "assessment", True),
    ("How do you design assessment tools that meet the principles of assessment?", "assessment", True),
    ("What documentation is required for a recognition outcome?", "assessment", True),
    ("Explain the requirements for reassessment opportunities.", "assessment", True),
    ("How should an RTO handle assessment appeals effectively?", "assessment", True),
    ("What are the requirements for assessment moderation activities?", "assessment", True),
    ("How do you ensure assessment decisions are consistent across assessors?", "assessment", True),
    
    # ============ Learner Support & Engagement ============
    ("What learner support mechanisms must an RTO provide?", "learner_support", True),
    ("How should an RTO identify and support learners with LLN requirements?", "learner_support", True),
    ("Explain the requirements for pre-enrollment information and advice.", "learner_support", True),
    ("What are the obligations for learner induction and orientation?", "learner_support", True),
    ("How should an RTO handle reasonable adjustment requests?", "learner_support", True),
    ("What constitutes appropriate learner feedback mechanisms?", "learner_support", True),
    ("Explain the requirements for monitoring learner progress.", "learner_support", True),
    ("How do you support learners experiencing personal difficulties that impact training?", "learner_support", True),
    ("What are the rules for language, literacy, and numeracy support?", "learner_support", True),
    ("How should an RTO maintain learner engagement in online delivery?", "learner_support", True),
    
    # ============ Quality Management ============
    ("What are the key elements of an effective quality management system for RTOs?", "quality", True),
    ("How should an RTO conduct internal audits effectively?", "quality", True),
    ("Explain the requirements for continuous improvement documentation.", "quality", True),
    ("What are the essential components of a training and assessment strategy?", "quality", True),
    ("How should an RTO manage non-conformances identified during audit?", "quality", True),
    ("What constitutes effective management of records under Clause 7.4?", "quality", True),
    ("Explain the requirements for governance and accountability structures.", "quality", True),
    ("How do you establish and monitor KPIs for training delivery?", "quality", True),
    ("What are the requirements for version control of training materials?", "quality", True),
    ("How should an RTO conduct training needs analysis for clients?", "quality", True),
    
    # ============ Financial & Business Management ============
    ("What financial management obligations apply to RTOs?", "financial", True),
    ("Explain the requirements for fee protection mechanisms.", "financial", True),
    ("How should an RTO handle refund requests and processing?", "financial", True),
    ("What are the transparency requirements for course fees and charges?", "financial", True),
    ("Explain the obligations around learner course money protection.", "financial", True),
    ("How should an RTO manage financial risk and sustainability?", "financial", True),
    ("What are the requirements for financial reporting and record-keeping?", "financial", True),
    ("How do you establish and manage learner access to funds?", "financial", True),
    ("What constitutes compliant trainer expense reimbursement?", "financial", True),
    ("Explain the requirements for government funding acquittal.", "financial", True),
    
    # ============ Data & Reporting ============
    ("What AVETMISS reporting obligations apply to RTOs?", "data", True),
    ("How should an RTO manage USI verification and validation?", "data", True),
    ("Explain the requirements for Unique Student Identifier data quality.", "data", True),
    ("What are the obligations for nationally recognized training data?", "data", True),
    ("How should an RTO prepare for ASQA data reporting audits?", "data", True),
    ("What constitutes compliant submission of training activity data?", "data", True),
    ("Explain the requirements for AVETerminology and classification standards.", "data", True),
    ("How do you manage data integrity in student management systems?", "data", True),
    ("What are the rules for retention and disposal of training records?", "data", True),
    ("How should an RTO handle data breaches and learner privacy?", "data", True),
    
    # ============ CRICOS & International Students ============
    ("What are the CRICOS registration requirements for providers?", "international", True),
    ("Explain the requirements for marketing to international students.", "international", True),
    ("How should an RTO manage international student support services?", "international", True),
    ("What are the obligations for international student visa compliance?", "international", True),
    ("Explain the requirements for refund policies for international students.", "international", True),
    ("How do you handle transfer requests from international students?", "international", True),
    ("What constitutes compliant course progress monitoring?", "international", True),
    ("Explain the requirements for attendance monitoring of international students.", "international", True),
    ("How should an RTO manage抱歉s for international students?", "international", True),
    ("What are the ESOS framework obligations for RTOs?", "international", True),
    
    # ============ Industry Engagement ============
    ("How should an RTO demonstrate industry engagement?", "industry", True),
    ("What constitutes effective industry consultation for training design?", "industry", True),
    ("Explain the requirements for industry advisory board operations.", "industry", True),
    ("How do you establish formal industry partnership arrangements?", "industry", True),
    ("What are the rules for industry placement supervision?", "industry", True),
    ("Explain the requirements for workplace trainer qualification.", "industry", True),
    ("How should an RTO maintain industry currency of trainers?", "industry", True),
    ("What constitutes valid industry feedback mechanisms?", "industry", True),
    ("How do you incorporate industry trends into training delivery?", "industry", True),
    ("What are the requirements for industry validated assessment tools?", "industry", True),
    
    # ============ Digital & Technology ============
    ("What are the requirements for e-learning platform accessibility?", "digital", True),
    ("How should an RTO ensure cybersecurity in online learning?", "digital", True),
    ("Explain the requirements for digital assessment authenticity.", "digital", True),
    ("What are the rules for online proctoring of assessments?", "digital", True),
    ("How do you maintain LMS data quality and integrity?", "digital", True),
    ("What constitutes compliant digital record-keeping?", "digital", True),
    ("Explain the requirements for learning analytics implementation.", "digital", True),
    ("How should an RTO manage technology integration in training?", "digital", True),
    ("What are the requirements for remote assessment delivery?", "digital", True),
    ("How do you ensure digital equity for all learners?", "digital", True),
    
    # ============ WHS & Safety ============
    ("What WHS obligations apply to RTO training facilities?", "whs", True),
    ("How should an RTO manage workplace safety in training environments?", "whs", True),
    ("Explain the requirements for first aid training and facilities.", "whs", True),
    ("What are the rules for hazardous materials handling in training?", "whs", True),
    ("How do you conduct WHS risk assessments for training activities?", "whs", True),
    ("What constitutes compliant emergency procedure training?", "whs", True),
    ("Explain the requirements for protective equipment in training.", "whs", True),
    ("How should an RTO manage incident reporting and investigation?", "whs", True),
    ("What are the obligations for young worker safety training?", "whs", True),
    ("How do you ensure WHS compliance for simulated work environments?", "whs", True),
]


def generate_seed_prompts():
    """Generate seed data for prompt_templates table."""
    prompts = []
    now = datetime.now(timezone.utc)
    
    for i, (title, category, is_approved) in enumerate(PROMPT_TEMPLATES):
        prompts.append({
            "id": str(uuid.uuid4()),
            "title": title,
            "body": f"You are an AI compliance assistant for Australian RTOs. {title} Provide detailed guidance based on the Standards for Registered Training Organisations 2015, relevant legislation, and best practices.",
            "category": category,
            "is_approved": is_approved,
            "suggested_by": None,
            "approved_by": None,
            "created_at": now.isoformat(),
        })
    
    return prompts


if __name__ == "__main__":
    prompts = generate_seed_prompts()
    print(f"Generated {len(prompts)} prompt templates")
    for p in prompts[:5]:
        print(f"  - {p['title']} ({p['category']})")
    print("  ...")
