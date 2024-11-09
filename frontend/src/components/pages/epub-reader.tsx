import { ReactReader } from "react-reader";
import useLocalStorageState from "use-local-storage-state";

interface ReaderProps {
  url: string;
  title: string;
}

export const EpubReader = ({ url, title }: ReaderProps) => {
  const [location, setLocation] = useLocalStorageState<string | number>(
    "moka-continue-reading",
    {
      defaultValue: 1,
    }
  );

  return (
    <div className="h-[90vh]">
      <h2>{title}</h2>
      <ReactReader
        url={`/api/epub-proxy?url=${encodeURIComponent(url)}`}
        title={title}
        showToc={true}
        location={location}
        locationChanged={(loc: string) => setLocation(loc)}
        epubInitOptions={{
          openAs: "epub",
        }}
        getRendition={(rendition: any) => {
          rendition.on("started", () => {
            // Set sandbox permissions for the iframe
            const iframe = document.querySelector('iframe[sandbox]');
            if (iframe) {
              iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups');
            }
          });
        }}
      />
    </div>
  );
};
