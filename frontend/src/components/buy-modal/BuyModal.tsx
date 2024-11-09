import { BuyModalInfo } from "./BuyModalInfo";
import { BuyModalTemplate } from "./BuyModalTemplate";
import { LoadingSaleCard } from "./LoadingSaleCard";

function BuyModal({
  closeModal,
  item,
}: {
  closeModal: () => void;
  item: any;
}): JSX.Element {
  const { metadataId, bookTitle } = item;

  const modalInfo = { isTokenListLoading: false };
  const newModalInfo = { metadataId, bookTitle, ...modalInfo };

  if (modalInfo?.isTokenListLoading) {
    return (
      <BuyModalTemplate closeModal={closeModal}>
        <LoadingSaleCard />
      </BuyModalTemplate>
    );
  }

  return (
    <BuyModalTemplate closeModal={closeModal}>
      <BuyModalInfo data={newModalInfo} />
    </BuyModalTemplate>
  );
}

export default BuyModal;
