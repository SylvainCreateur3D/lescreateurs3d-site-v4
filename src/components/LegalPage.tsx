import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

export type LegalKind = 'mentions' | 'cgv' | 'remboursement' | 'confidentialite';

interface LegalPageProps {
  kind: LegalKind;
  onGoBack: () => void;
}

// Identité de l'éditeur : une seule source pour toutes les pages.
const EDITEUR = {
  nom: 'Sylvain DAUTELLE',
  marque: 'Les Créateurs 3D',
  statut: 'Entrepreneur individuel (micro-entreprise)',
  siren: '818 202 251',
  siret: '818 202 251 00018',
  tva: 'FR37 818 202 251',
  adresse: '23 rue de la Chapelle, 75018 Paris, France',
  email: 'dautelle.sylvain@gmail.com',
};
// À RENSEIGNER dès l'adhésion à un médiateur de la consommation (obligatoire pour vendre à des particuliers) :
// nom, adresse postale et site internet du médiateur. Tant que c'est vide, la phrase de médiation n'est pas affichée.
const MEDIATEUR = '';
const MAJ = '4 novembre 2026';

const mail = <a className="text-indigo-600 font-bold underline" href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-extrabold text-slate-900 mb-3">{title}</h2>
      <div className="space-y-3 text-slate-700 font-medium leading-relaxed">{children}</div>
    </section>
  );
}

function Identite() {
  return (
    <ul className="list-disc pl-6 space-y-1">
      <li><strong>{EDITEUR.nom}</strong>, exerçant sous le nom commercial « {EDITEUR.marque} » — {EDITEUR.statut}</li>
      <li>SIREN {EDITEUR.siren} — SIRET {EDITEUR.siret}</li>
      <li>N° de TVA intracommunautaire : {EDITEUR.tva}</li>
      <li>Adresse : {EDITEUR.adresse}</li>
      <li>E-mail : {mail}</li>
    </ul>
  );
}

const PAGES: Record<LegalKind, { title: string; body: () => ReactNode }> = {
  mentions: {
    title: 'Mentions légales',
    body: () => (
      <>
        <Section title="Éditeur du site">
          <Identite />
          <p>Directeur de la publication : {EDITEUR.nom}.</p>
        </Section>
        <Section title="Hébergement">
          <p>Le site lescreateurs3d.com est hébergé par Vercel Inc. (États-Unis, vercel.com).</p>
        </Section>
        <Section title="Vente en ligne des extensions SketchUp IzyStudio">
          <p>
            Les paiements des extensions IzyStudio sont traités par Stripe (stripe.com), via son service Link, qui agit en tant que
            revendeur officiel (« merchant of record », achat « Vendu via Link ») : Stripe encaisse le paiement, applique la TVA et émet la facture.
            Voir les <a className="text-indigo-600 font-bold underline" href="/cgv">conditions générales de vente</a>.
          </p>
        </Section>
        <Section title="Propriété intellectuelle">
          <p>
            L'ensemble du site (textes, images, vidéos, logos, logiciels) est la propriété de {EDITEUR.nom} ou de ses partenaires.
            Toute reproduction sans autorisation écrite est interdite.
          </p>
        </Section>
        <Section title="Données personnelles">
          <p>Voir la <a className="text-indigo-600 font-bold underline" href="/confidentialite">politique de confidentialité</a>.</p>
        </Section>
        <Section title="Contact">
          <p>Pour toute question : {mail}.</p>
        </Section>
      </>
    ),
  },

  cgv: {
    title: 'Conditions générales de vente — Extensions SketchUp IzyStudio',
    body: () => (
      <>
        <Section title="1. Vendeur et objet">
          <Identite />
          <p>
            Les présentes conditions régissent la vente en ligne de licences d'utilisation des extensions SketchUp
            IzyStudio (Configurators, Modeling, Media, Control et le pack « Full Suite »), proposées sur lescreateurs3d.com.
          </p>
        </Section>
        <Section title="2. Paiement et revendeur officiel">
          <p>
            Les commandes sont traitées par <strong>Stripe</strong>, via son service <strong>Link</strong>, revendeur officiel
            (« merchant of record » : la commande apparaît « Vendu via Link »). Stripe encaisse le paiement, perçoit et reverse la TVA
            et vous envoie le reçu et la facture. Les conditions de paiement affichées sur la page de paiement s'appliquent à votre
            commande en complément des présentes. {EDITEUR.nom} reste l'éditeur des logiciels et le
            concédant de la licence.
          </p>
        </Section>
        <Section title="3. Produits et prix">
          <p>
            Chaque offre donne accès aux extensions décrites sur la page « Extensions SketchUp ». Les prix sont indiqués en euros
            hors taxes, avec leur équivalent toutes taxes comprises pour un acheteur en France ; la TVA (ou taxe équivalente) du pays
            de l'acheteur est calculée et ajoutée sur la page de paiement, avant validation de la commande. Le prix applicable est celui affiché au moment de la commande.
          </p>
        </Section>
        <Section title="4. Commande et livraison">
          <p>
            La commande est conclue à la validation du paiement. La livraison est immédiate et dématérialisée : vous recevez par e-mail
            votre clé de licence et les liens de téléchargement, et la clé s'affiche à la fin de l'achat. Un achat ultérieur avec
            la même adresse e-mail complète votre licence existante (la clé reste la même).
          </p>
        </Section>
        <Section title="5. Licence d'utilisation">
          <ul className="list-disc pl-6 space-y-1">
            <li>Licence personnelle, non exclusive et non cessible, valable sans limite de durée pour les packs achetés.</li>
            <li>Elle peut être activée sur 2 ordinateurs au maximum. Un poste peut être libéré depuis la fenêtre de licence pour en activer un autre.</li>
            <li>Les mises à jour de la version achetée sont incluses. Une éventuelle future version majeure pourra être proposée séparément.</li>
            <li>Il est interdit de partager la clé, de copier ou revendre les extensions, ou de contourner la vérification de licence.</li>
          </ul>
        </Section>
        <Section title="6. Droit de rétractation et remboursement">
          <p>
            Vous pouvez demander le remboursement de votre achat dans les <strong>14 jours</strong> suivant la commande, sans motif.
            Les modalités figurent dans la <a className="text-indigo-600 font-bold underline" href="/remboursement">politique de remboursement</a>.
          </p>
        </Section>
        <Section title="7. Garanties légales">
          <p>
            Vous bénéficiez de la garantie légale de conformité pour les contenus numériques (articles L.224-25-1 et suivants du Code de la
            consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil).
          </p>
        </Section>
        <Section title="8. Assistance">
          <p>Pour toute question ou difficulté d'installation ou d'activation : {mail}.</p>
        </Section>
        <Section title="9. Données personnelles">
          <p>Voir la <a className="text-indigo-600 font-bold underline" href="/confidentialite">politique de confidentialité</a>.</p>
        </Section>
        <Section title="10. Droit applicable et médiation">
          <p>
            Les présentes conditions sont soumises au droit français. En cas de litige, vous pouvez d'abord nous écrire à {mail}, ou
            vous adresser au support Link de Stripe, qui traite votre paiement.
            {MEDIATEUR && <> Si le litige persiste, vous pouvez recourir gratuitement au médiateur de la consommation : {MEDIATEUR}.</>}
          </p>
        </Section>
      </>
    ),
  },

  remboursement: {
    title: 'Politique de remboursement',
    body: () => (
      <>
        <Section title="Remboursement sous 14 jours">
          <p>
            Vous pouvez demander le remboursement intégral de votre achat d'extensions IzyStudio dans les <strong>14 jours</strong> suivant
            la commande, sans avoir à vous justifier.
          </p>
        </Section>
        <Section title="Comment faire">
          <p>
            Écrivez-nous à {mail} en indiquant l'adresse e-mail utilisée pour l'achat, ou adressez votre demande au support Link de Stripe,
            qui traite le paiement (lien de contact de votre reçu). Le remboursement est effectué sur le moyen de paiement utilisé.
          </p>
        </Section>
        <Section title="Après le remboursement">
          <p>La licence concernée est désactivée et les extensions correspondantes cessent de fonctionner.</p>
        </Section>
        <Section title="Après 14 jours">
          <p>
            Les licences sont définitives. Si une extension ne fonctionne pas comme décrit, contactez-nous : nous corrigeons les anomalies, et
            les garanties légales décrites dans les <a className="text-indigo-600 font-bold underline" href="/cgv">conditions générales de vente</a> restent applicables.
          </p>
        </Section>
      </>
    ),
  },

  confidentialite: {
    title: 'Politique de confidentialité',
    body: () => (
      <>
        <Section title="Responsable du traitement">
          <Identite />
        </Section>
        <Section title="Données collectées lors d'un achat d'extension">
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Paiement</strong> : traité directement par Stripe et son service Link (nom, e-mail, pays, moyen de paiement). Nous ne recevons ni ne conservons vos données bancaires. Stripe est responsable de ce traitement : voir sa politique de confidentialité sur stripe.com/privacy.</li>
            <li><strong>Licence</strong> : nous recevons de Stripe votre adresse e-mail et les références de la commande, afin de créer votre licence et de vous envoyer votre clé et vos liens de téléchargement.</li>
            <li><strong>Activation</strong> : lorsque vous activez une licence dans SketchUp, une empreinte anonymisée de votre ordinateur (non réversible), son nom et son système (Windows ou macOS) sont enregistrés pour appliquer la limite de 2 ordinateurs.</li>
          </ul>
          <p>Bases légales : exécution du contrat (livraison de la licence), obligations légales (comptabilité), intérêt légitime (sécurité et lutte contre la fraude).</p>
        </Section>
        <Section title="Prestataires">
          <p>
            Stripe et Link (paiement), Keygen (gestion des licences), notre fournisseur d'envoi d'e-mails, Google Cloud (serveur d'achat, région Europe) et
            Vercel (hébergement du site). Certains sont situés hors de l'Union européenne ; les transferts s'appuient sur les garanties prévues par le RGPD.
          </p>
        </Section>
        <Section title="Durée de conservation">
          <p>
            Les données de licence sont conservées tant que la licence est active. Les pièces comptables sont conservées 10 ans, comme la loi l'exige.
          </p>
        </Section>
        <Section title="Navigation sur le site">
          <p>
            Le site mesure son audience avec un identifiant aléatoire stocké dans votre navigateur, le type d'appareil, la page consultée et la
            provenance de la visite. Des services intégrés (YouTube, Calendly, Elfsight) peuvent déposer leurs propres cookies.
          </p>
        </Section>
        <Section title="Vos droits">
          <p>
            Vous pouvez demander l'accès, la rectification ou l'effacement de vos données, vous opposer à leur traitement ou demander leur
            portabilité en écrivant à {mail}. Vous pouvez aussi introduire une réclamation auprès de la CNIL (cnil.fr).
          </p>
        </Section>
      </>
    ),
  },
};

export default function LegalPage({ kind, onGoBack }: LegalPageProps) {
  const page = PAGES[kind];
  return (
    <div className="bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <button
          onClick={onGoBack}
          className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white rounded-full border border-slate-200 shadow-sm transition-all hover:shadow-md mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour à l'accueil
        </button>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">{page.title}</h1>
        <p className="text-sm text-slate-400 font-semibold mb-10">Dernière mise à jour : {MAJ}</p>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10">{page.body()}</div>
      </div>
    </div>
  );
}
