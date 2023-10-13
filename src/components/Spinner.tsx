export const Spinner = () => {
  return (
    <main className="w-screen h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-[320px]">
        <div className="lds-ellipsis">
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    </main>
  )
}
