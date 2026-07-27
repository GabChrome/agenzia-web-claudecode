import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { IconImage, IconLink } from '../ui';

// Editor per il corpo dell'articolo: formattazione di base più immagini
// inserite dentro al testo. L'HTML che produce viene comunque filtrato dal
// server prima di essere salvato (vedi sanitizePostHtml nel Worker) — qui ci
// limitiamo a non offrire nel menu nulla che quel filtro scarterebbe.
export function RichEditor({
  value,
  onChange,
  onUploadImage,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  placeholder?: string;
}) {
  const lastEmitted = useRef(value);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image.configure({ HTMLAttributes: { class: '' } }),
      Placeholder.configure({ placeholder: placeholder ?? 'Scrivi qui il testo dell’articolo…' }),
    ],
    content: value,
    editorProps: {
      attributes: { class: 'rte-body min-h-[220px] focus:outline-none px-3 py-2.5' },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  // Riallinea l'editor quando il testo cambia da fuori (es. ripresa di una
  // bozza): solo se non è l'eco della nostra stessa ultima modifica, altrimenti
  // il cursore salterebbe a ogni tasto premuto.
  useEffect(() => {
    if (editor && value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  async function pickImage(file: File) {
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      editor?.chain().focus().setImage({ src: url, alt: '' }).run();
    } finally {
      setUploading(false);
    }
  }

  function setLink() {
    if (!editor) return;
    const current = editor.getAttributes('link').href as string | undefined;
    // eslint-disable-next-line no-alert
    const url = window.prompt('Indirizzo del link (lascia vuoto per rimuoverlo)', current ?? 'https://');
    if (url === null) return;
    const chain = editor.chain().focus().extendMarkRange('link');
    if (url.trim() === '') chain.unsetLink().run();
    else chain.setLink({ href: url.trim() }).run();
  }

  if (!editor) return null;

  const Btn = ({
    active,
    onClick,
    label,
    children,
  }: {
    active?: boolean;
    onClick: () => void;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      // Senza questo, il click sposta il focus dal testo al pulsante prima
      // che il comando parta: ProseMirror perde la selezione e la
      // formattazione non si applica a quello che si scrive subito dopo.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-theme-sm px-1.5 text-sm font-semibold transition ${
        active ? 'bg-accent text-white' : 'text-soft hover:bg-surface2 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-theme border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface2/50 p-1.5">
        <Btn
          label="Grassetto"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </Btn>
        <Btn
          label="Corsivo"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </Btn>
        <Btn
          label="Barrato"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </Btn>
        <span className="mx-1 h-5 w-px bg-line" />
        <Btn
          label="Titolo"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Btn>
        <Btn
          label="Sottotitolo"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Btn>
        <span className="mx-1 h-5 w-px bg-line" />
        <Btn
          label="Elenco puntato"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •≡
        </Btn>
        <Btn
          label="Elenco numerato"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </Btn>
        <Btn
          label="Citazione"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝
        </Btn>
        <span className="mx-1 h-5 w-px bg-line" />
        <Btn label="Link" active={editor.isActive('link')} onClick={setLink}>
          <IconLink size={15} />
        </Btn>
        <Btn label="Immagine" onClick={() => fileInput.current?.click()}>
          {uploading ? '…' : <IconImage size={16} />}
        </Btn>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void pickImage(file);
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

