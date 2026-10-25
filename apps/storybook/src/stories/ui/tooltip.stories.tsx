import { Button } from "@bermula/design-system/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bermula/design-system/components/ui/tooltip";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconCopy } from "@tabler/icons-react";

const meta = {
  component: Tooltip,
  title: "UI/Tooltip",
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

// `TooltipProvider` sudah dipasang oleh DesignSystemProvider (decorator).
export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger
        render={<Button aria-label="Salin" size="icon" variant="outline" />}
      >
        <IconCopy aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>Salin ke papan klip</TooltipContent>
    </Tooltip>
  ),
};
