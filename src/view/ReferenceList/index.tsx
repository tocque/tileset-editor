import { FC, useMemo } from "react";
import { closeReference, openReference, setCurrentReferenceId, useReferenceList } from "@/store";
import { openLocalImage } from "@/utils/image";
import { IconImage, IconPlus } from "@douyinfe/semi-icons";
import { Button, Empty, Tabs } from "@douyinfe/semi-ui";
import { useMutation } from "react-query";
import { uniqueId } from "lodash-es";
import styles from "./index.module.less";
import ReferenceView from "./ReferenceView";

const References: FC = () => {

  const { references, currentReference } = useReferenceList();

  const tabList = useMemo(() => (
    references.map((e) => ({ tab: e.name, itemKey: e.id, closable: true }))
  ), [references]);

  const openReferenceMutation = useMutation(async () => {
    const result = await openLocalImage();
    if (!result) return;
    const { source, name } = result;
    const id = uniqueId("reference");
    openReference({
      id,
      name,
      source,
      opacity: 255,
      hue: 0,
    });
    setCurrentReferenceId(id);
  });

  return (
    <>
      {references.length > 0 ? (
        <Tabs
          className={styles.tab}
          type="card"
          tabList={tabList}
          tabBarExtraContent={(
            <Button
              icon={<IconPlus />}
              loading={openReferenceMutation.isLoading}
              onClick={() => openReferenceMutation.mutate()}
            />
          )}
          activeKey={currentReference?.id}
          onTabClick={(key) => {
            setCurrentReferenceId(key);
          }}
          onTabClose={(key) => {
            closeReference(key);
          }}
        >
          {currentReference && (
            <ReferenceView reference={currentReference} />
          )}
        </Tabs>
      ) : (
        <div className={styles.empty}>
          <Empty
            description="打开本地文件作为参照"
          >
            <Button
              type="primary"
              icon={<IconImage />}
              loading={openReferenceMutation.isLoading}
              onClick={() => openReferenceMutation.mutate()}
            >
              打开文件
            </Button>
          </Empty>
        </div>
      )}
    </>
  );
}

export default References;
