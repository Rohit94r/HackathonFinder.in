/** Page heading and spacing around the messages view. */
export default function MessagesFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-surface py-6 sm:py-8">
      <div className="container-page">
        <div className="mb-4">
          <h1 className="font-sans text-2xl font-bold normal-case tracking-normal sm:text-3xl">Messages</h1>
          <p className="mt-1 text-sm text-ink/70">Private chats with students you’ve teamed up with. Only the two of you can read them.</p>
        </div>
        {children}
      </div>
    </section>
  );
}
