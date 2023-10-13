import { useMetadataByMetadataId } from '@/hooks/useMetadatabyMetadataId';
import { BuyModalInfo } from './BuyModalInfo';
import { BuyModalTemplate } from './BuyModalTemplate';
import { LoadingSaleCard } from './LoadingSaleCard';

function BuyModal({
  closeModal,
  item,
}: {
  closeModal: () => void
  item: any
}): JSX.Element {
  const { metadataId } = item;

  const modalInfo = useMetadataByMetadataId({ metadataId });

  if (modalInfo?.isTokenListLoading) {
    return (
      <BuyModalTemplate closeModal={closeModal}>
        <LoadingSaleCard />
      </BuyModalTemplate>
    );
  }

  return (
    <BuyModalTemplate closeModal={closeModal}>
      <BuyModalInfo data={modalInfo} />
    </BuyModalTemplate>
  );
}

export default BuyModal;
