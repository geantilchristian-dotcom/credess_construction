"use client";

import "./devis.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { useCredessPublicData, PublicQuoteQuestion } from "@/hooks/useCredessPublicData";
import { whatsappUrl } from "@/lib/credess-links";

type Answers = Record<string, string>;

type ContactForm = {
  nom: string;
  telephone: string;
  email: string;
};

const fallbackQuestions: PublicQuoteQuestion[] = [
  { id: "fallback-service", question: "Quel service recherchez-vous ?", question_type: "choice", options: ["Construction", "Plan architectural", "Modélisation 3D", "Études techniques", "Suivi de chantier", "Rénovation", "Autre"], placeholder: null, is_required: true, sort_order: 1, is_active: true },
  { id: "fallback-building", question: "Quel type de bâtiment ?", question_type: "choice", options: ["Maison", "Villa", "Immeuble", "Boutique / Commerce", "Bureau", "École", "Église", "Autre"], placeholder: null, is_required: true, sort_order: 2, is_active: true },
  { id: "fallback-location", question: "Où se trouve votre projet ?", question_type: "text", options: [], placeholder: "Ex. Bukavu, Ibanda", is_required: true, sort_order: 3, is_active: true },
  { id: "fallback-levels", question: "Combien de niveaux prévoyez-vous ?", question_type: "choice", options: ["RDC", "R+1", "R+2", "R+3", "R+4 ou plus", "Je ne sais pas encore"], placeholder: null, is_required: false, sort_order: 4, is_active: true },
  { id: "fallback-surface", question: "Quelle est la surface approximative ?", question_type: "text", options: [], placeholder: "Ex. 300 m²", is_required: false, sort_order: 5, is_active: true },
  { id: "fallback-description", question: "Décrivez-nous votre projet", question_type: "textarea", options: [], placeholder: "Ex. Je souhaite construire une maison R+1 de 4 chambres...", is_required: true, sort_order: 6, is_active: true },
  { id: "fallback-budget", question: "Quel est votre budget approximatif ?", question_type: "choice", options: ["Moins de 10 000 $", "10 000 – 30 000 $", "30 000 – 50 000 $", "50 000 – 100 000 $", "Plus de 100 000 $", "Je ne sais pas encore"], placeholder: null, is_required: false, sort_order: 7, is_active: true },
  { id: "fallback-delay", question: "Quand souhaitez-vous commencer ?", question_type: "choice", options: ["Dès que possible", "Dans 1 à 3 mois", "Dans 3 à 6 mois", "Plus tard", "Je souhaite seulement une estimation"], placeholder: null, is_required: false, sort_order: 8, is_active: true },
];

function createReference() {
  const now = new Date();
  const date =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CREDESS-DD-${date}-${code}`;
}

export default function DevisPage() {
  const { quoteQuestions, settings } = useCredessPublicData();
  const questions = quoteQuestions.length > 0 ? quoteQuestions : fallbackQuestions;

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState<ContactForm>({ nom: "", telephone: "", email: "" });
  const [reference, setReference] = useState("");
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const contactSteps = 3;
  const totalQuestions = questions.length + contactSteps;
  const recapStep = totalQuestions + 1;
  const currentQuestion = step <= questions.length ? questions[step - 1] : null;
  const contactIndex = step - questions.length;

  useEffect(() => {
    const saved = sessionStorage.getItem("credess-devis-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.contact) setContact(parsed.contact);
        if (parsed.step) setStep(parsed.step);
        setReference(parsed.reference || createReference());
      } catch {
        setReference(createReference());
      }
    } else {
      setReference(createReference());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    sessionStorage.setItem(
      "credess-devis-v2",
      JSON.stringify({ answers, contact, step, reference })
    );
  }, [answers, contact, step, reference, ready]);

  useEffect(() => {
    if (step > questions.length + 4) {
      setStep(1);
    }
  }, [questions.length, step]);

  const currentValue = currentQuestion ? answers[currentQuestion.id] || "" : "";

  const canContinue = useMemo(() => {
    if (currentQuestion) {
      if (!currentQuestion.is_required) return true;
      return currentValue.trim().length > 0;
    }
    if (contactIndex === 1) return contact.nom.trim().length > 1;
    if (contactIndex === 2) return contact.telephone.trim().length > 5;
    return true;
  }, [currentQuestion, currentValue, contactIndex, contact]);

  function goNext() {
    setStep((value) => Math.min(value + 1, recapStep));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((value) => Math.max(value - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseAnswer(question: PublicQuoteQuestion, value: string) {
    setAnswers((previous) => ({ ...previous, [question.id]: value }));
    window.setTimeout(goNext, 150);
  }

  function buildPdf() {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const red = [227, 6, 19] as const;
    const black = [8, 10, 12] as const;
    const gray = [105, 110, 115] as const;
    const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());

    const drawHeader = () => {
      pdf.setFillColor(...black);
      pdf.rect(0, 0, 210, 29, "F");
      pdf.setFillColor(...red);
      pdf.rect(13, 10, 3, 10, "F");
      pdf.rect(18, 6, 3, 14, "F");
      pdf.rect(23, 9, 3, 11, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("CREDESS", 32, 14);
      pdf.setTextColor(...red);
      pdf.setFontSize(7);
      pdf.text("CONSTRUCTION", 32, 19);
    };

    drawHeader();
    pdf.setTextColor(...black);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("DEMANDE DE DEVIS", 13, 44);
    pdf.setDrawColor(...red);
    pdf.setLineWidth(1);
    pdf.line(13, 49, 58, 49);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...gray);
    pdf.text(`Référence : ${reference}`, 13, 57);
    pdf.text(`Date : ${today}`, 125, 57);

    pdf.setFillColor(247, 247, 248);
    pdf.rect(13, 65, 184, 31, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...red);
    pdf.text("INFORMATIONS DU CLIENT", 18, 73);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...black);
    pdf.setFontSize(9);
    pdf.text(`Nom : ${contact.nom || "—"}`, 18, 82);
    pdf.text(`Téléphone : ${contact.telephone || "—"}`, 18, 89);
    pdf.text(`E-mail : ${contact.email || "Non renseigné"}`, 105, 82);

    let y = 108;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...red);
    pdf.setFontSize(8);
    pdf.text("INFORMATIONS DU PROJET", 13, y);
    y += 7;

    questions.forEach((question, index) => {
      const answer = answers[question.id] || "Non renseigné";
      const labelLines = pdf.splitTextToSize(question.question, 62) as string[];
      const valueLines = pdf.splitTextToSize(answer, 105) as string[];
      const rowHeight = Math.max(11, Math.max(labelLines.length, valueLines.length) * 4.5 + 5);

      if (y + rowHeight > 272) {
        pdf.addPage();
        drawHeader();
        y = 40;
      }

      const bg = index % 2 === 0 ? 250 : 255;
      pdf.setFillColor(bg, bg, bg);
      pdf.rect(13, y, 184, rowHeight, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...gray);
      pdf.setFontSize(7.7);
      pdf.text(labelLines, 17, y + 6);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...black);
      pdf.text(valueLines, 80, y + 6);
      y += rowHeight;
    });

    if (y + 30 > 278) {
      pdf.addPage();
      drawHeader();
      y = 42;
    }

    y += 8;
    pdf.setFillColor(250, 250, 250);
    pdf.rect(13, y, 184, 22, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...black);
    pdf.setFontSize(8);
    pdf.text("NOTE", 18, y + 8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...gray);
    pdf.setFontSize(7.5);
    pdf.text(
      "Ce document constitue une demande de devis. Les prix et conditions définitifs seront établis après étude du projet par CREDESS Construction.",
      18,
      y + 14,
      { maxWidth: 173 }
    );

    return pdf;
  }

  function newDevis() {
    sessionStorage.removeItem("credess-devis-v2");
    setAnswers({});
    setContact({ nom: "", telephone: "", email: "" });
    setReference(createReference());
    setStep(1);
    setSendError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadPdf() {
    buildPdf().save(`${reference}.pdf`);
  }

  async function sendRequest() {
    setSending(true);
    setSendError("");

    try {
      const pdfBlob = buildPdf().output("blob");
      const payloadAnswers = Object.fromEntries(
        questions.map((question) => [question.question, answers[question.id] || ""])
      );

      const body = new FormData();
      body.append("reference", reference);
      body.append("client_name", contact.nom);
      body.append("phone", contact.telephone);
      body.append("email", contact.email);
      body.append("answers", JSON.stringify(payloadAnswers));
      body.append("pdf", pdfBlob, `${reference}.pdf`);

      const response = await fetch("/api/public/quote-request", {
        method: "POST",
        body,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Impossible d'enregistrer la demande.");
      }

      const summary = questions
        .map((question) => `${question.question}\n${answers[question.id] || "Non renseigné"}`)
        .join("\n\n");

      const message = `Bonjour CREDESS Construction,\n\nJe souhaite vous transmettre ma demande de devis.\n\nRéférence : ${reference}\nClient : ${contact.nom}\nTéléphone : ${contact.telephone}\nE-mail : ${contact.email || "Non renseigné"}\n\n${summary}${result.pdf_url ? `\n\nPDF : ${result.pdf_url}` : ""}`;
      const whatsapp = settings.whatsapp || settings.phone || "";

      if (whatsapp) {
        window.open(whatsappUrl(whatsapp, message), "_blank", "noopener,noreferrer");
      }
    } catch (caught) {
      setSendError(caught instanceof Error ? caught.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  function renderQuestion() {
    if (!currentQuestion) {
      if (contactIndex === 1) {
        return (
          <input
            autoFocus
            className="singleInput"
            value={contact.nom}
            placeholder="Votre nom complet"
            onChange={(event) => setContact((previous) => ({ ...previous, nom: event.target.value }))}
          />
        );
      }
      if (contactIndex === 2) {
        return (
          <input
            autoFocus
            type="tel"
            className="singleInput"
            value={contact.telephone}
            placeholder="+243..."
            onChange={(event) => setContact((previous) => ({ ...previous, telephone: event.target.value }))}
          />
        );
      }
      return (
        <>
          <input
            autoFocus
            type="email"
            className="singleInput"
            value={contact.email}
            placeholder="exemple@email.com"
            onChange={(event) => setContact((previous) => ({ ...previous, email: event.target.value }))}
          />
          <button className="skipQuestion" onClick={goNext}>Je préfère ne pas renseigner d&apos;e-mail</button>
        </>
      );
    }

    if (currentQuestion.question_type === "choice") {
      const options = Array.isArray(currentQuestion.options) ? currentQuestion.options : [];
      return (
        <div className="singleChoices">
          {options.map((item) => (
            <button
              key={item}
              type="button"
              className={currentValue === item ? "singleChoice selected" : "singleChoice"}
              onClick={() => chooseAnswer(currentQuestion, item)}
            >
              {item}<span>→</span>
            </button>
          ))}
        </div>
      );
    }

    if (currentQuestion.question_type === "textarea") {
      return (
        <textarea
          autoFocus
          className="singleTextarea"
          rows={7}
          value={currentValue}
          placeholder={currentQuestion.placeholder || "Votre réponse..."}
          onChange={(event) => setAnswers((previous) => ({ ...previous, [currentQuestion.id]: event.target.value }))}
        />
      );
    }

    return (
      <input
        autoFocus
        type={currentQuestion.question_type === "number" ? "number" : "text"}
        className="singleInput"
        value={currentValue}
        placeholder={currentQuestion.placeholder || "Votre réponse..."}
        onChange={(event) => setAnswers((previous) => ({ ...previous, [currentQuestion.id]: event.target.value }))}
      />
    );
  }

  const title = currentQuestion?.question ||
    (contactIndex === 1 ? "Quel est votre nom ?" : contactIndex === 2 ? "Quel est votre numéro WhatsApp ?" : "Quelle est votre adresse e-mail ?");

  return (
    <main className="oneQuestionPage">
      <header className="quoteWizardHeader">
        <Link href="/" className="logo">
          <span className="logoMark"><i /><i /><i /></span>
          <span className="logoText"><strong>CREDESS</strong><small>CONSTRUCTION</small></span>
        </Link>
        <Link href="/" className="quoteWizardClose">×</Link>
      </header>

      {step <= totalQuestions ? (
        <section className="oneQuestion">
          <div className="oneQuestionProgress">
            <div>
              <span>QUESTION {step} SUR {totalQuestions}</span>
              <strong>{Math.round((step / totalQuestions) * 100)}%</strong>
            </div>
            <i><b style={{ width: `${(step / totalQuestions) * 100}%` }} /></i>
          </div>

          <div className="oneQuestionContent">
            <h1>{title}</h1>
            {renderQuestion()}
            {currentQuestion && !currentQuestion.is_required && currentQuestion.question_type !== "choice" && (
              <button className="skipQuestion" onClick={goNext}>Passer cette question</button>
            )}
          </div>

          <div className="oneQuestionNavigation">
            {step > 1 ? <button onClick={goBack} className="oneBack">← Retour</button> : <span />}
            {currentQuestion?.question_type !== "choice" && (
              <button onClick={goNext} className="oneNext" disabled={!canContinue}>
                Continuer <span>→</span>
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="devisRecapPage">
          <div className="recapHeading">
            <small>VOTRE DEMANDE EST PRÊTE</small>
            <h1>Vérifiez avant d&apos;envoyer</h1>
            <p>Voici le document administratif qui sera enregistré chez CREDESS Construction.</p>
          </div>

          <div className="a4Preview">
            <div className="a4Header">
              <div><strong>CREDESS</strong><small>CONSTRUCTION</small></div>
              <span>DEMANDE DE DEVIS</span>
            </div>
            <div className="a4DocumentTitle">
              <h2>Demande de devis</h2>
              <div><span>Réf. {reference}</span><span>{new Intl.DateTimeFormat("fr-FR").format(new Date())}</span></div>
            </div>
            <div className="a4Section">
              <h3>Informations du client</h3>
              <div className="a4Client">
                <p><span>Nom</span><strong>{contact.nom}</strong></p>
                <p><span>Téléphone</span><strong>{contact.telephone}</strong></p>
                <p><span>E-mail</span><strong>{contact.email || "Non renseigné"}</strong></p>
              </div>
            </div>
            <div className="a4Section">
              <h3>Informations du projet</h3>
              {questions.map((question) => (
                <div className="a4Row" key={question.id}>
                  <span>{question.question}</span>
                  <strong>{answers[question.id] || "Non renseigné"}</strong>
                </div>
              ))}
            </div>
            <div className="a4Notice">
              <strong>NOTE</strong>
              <p>Ce document constitue une demande de devis. Les prix et conditions définitifs seront établis après étude du projet par CREDESS Construction.</p>
            </div>
            <div className="a4Footer"><span>CREDESS Construction</span><span>{reference}</span></div>
          </div>

          {sendError && <div className="devisSendError">{sendError}</div>}

          <div className="newDevisWrapper">
            <button type="button" className="newDevisButton" onClick={newDevis}><span>＋</span>Nouveau devis</button>
          </div>
          <div className="recapActions">
            <button className="recapEdit" onClick={() => setStep(1)}>← Modifier mes réponses</button>
            <button className="recapDownload" onClick={downloadPdf}>Télécharger le PDF</button>
            <button className="recapSend" onClick={sendRequest} disabled={sending}>
              {sending ? "Enregistrement..." : "Envoyer la demande"}<span>→</span>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
