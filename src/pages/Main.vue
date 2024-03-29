<template>
  <div class="page">
    <div class="content">
      <h1>Hyperdeploy</h1>
      <div class="form">
        <div class="block block-initcode">
          <HyperTextArea
            v-model="initcode"
            placeholder="initcode"
          />
          <div class="buttons">
            <HyperButton @click="setStorageInitcode">
              Simple Storage
            </HyperButton>
            <HyperButton @click="setOwnerInitcode">Ownership</HyperButton>
            <HyperButton @click="setBallotInitcode">Ballot</HyperButton>
          </div>
        </div>
        <div class="block block-salt">
          <HyperInput
            v-model="salt"
            placeholder="salt"
          />
          <div>
            <HyperButton @click="generateSalt">Generate salt</HyperButton>
          </div>
        </div>
        <div class="block">
          <select
            :value="source"
            @change="handleSourceChainChange"
          >
            <option
              v-for="chain in CHAINS"
              :key="chain"
              :value="chain"
              :disabled="!isSourceSupported(chain)"
            >
              {{ getChainName(chain) }}
            </option>
          </select>
        </div>
        <div class="block">
          <select
            v-model="target"
            multiple
          >
            <option
              v-for="chain in CHAINS"
              :key="chain"
              :value="chain"
              :disabled="chain === source || !isTargetSupported(chain)"
            >
              {{ getChainName(chain) }}
            </option>
          </select>
        </div>
        <div
          v-if="hasSafes"
          class="block block-safes"
        >
          <select
            :value="selectedSafe"
            @change="handleSafeChange"
          >
            <option
              v-for="safe in chainSafes"
              :key="safe"
              :value="safe"
            >
              {{ safe }}
            </option>
          </select>
          <HyperButton @click="openSafesPage">Manage</HyperButton>
        </div>
        <div class="block">
          <HyperButton
            :disabled="!isAuthorized || !isDeployable || isDeploying"
            primary
            @click="deploy"
          >
            Deploy
          </HyperButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isHex, type Hex, type Address } from 'viem';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import HyperButton from '@/components/HyperButton.vue';
import HyperInput from '@/components/HyperInput.vue';
import HyperTextArea from '@/components/HyperTextArea.vue';
import useAccount from '@/composables/useAccount';
import useChain from '@/composables/useChain';
import useEnv from '@/composables/useEnv';
import useSafe from '@/composables/useSafe';
import type { Chain } from '@/utils/core';
import {
  CHAINS,
  CHAIN_SEPOLIA,
  CHAIN_POLYGON_MUMBAI,
  CHAIN_SCROLL_SEPOLIA,
  CHAIN_ALFAJORES,
  CHAIN_BSC_TESTNET,
  CHAIN_FUJI,
  CHAIN_MOONBASE_ALPHA,
  isTargetSupported,
  isSourceSupported,
} from '@/utils/core';
import deployWithSafe from '@/utils/deployWithSafe';
import {
  getBallotInitcode,
  getOwnerInitcode,
  getSimpleStorageInitcode,
} from '@/utils/initcode';

const router = useRouter();
const { pimlicoApiKey } = useEnv();
const { isAuthorized, account } = useAccount();
const { id: chainId, setId: setChainId } = useChain();
const { chainSafes, hasSafes, selectSafe, selectedSafe } = useSafe();

const initcode = ref('');
const salt = ref('');
const source = computed(() => chainId.value);
const target = ref<Chain[]>([CHAIN_POLYGON_MUMBAI]);

watch(source, () => {
  target.value = [];
});

const isDeployable = computed(() => {
  // Init code should be a hex string
  const isInitcodeHex = isHex(initcode.value);
  if (!isInitcodeHex) return false;

  // Salt should be a 32 bytehex string
  const isSaltHex = isHex(salt.value);
  if (!isSaltHex) return false;
  if (salt.value.length !== 66) return false;

  // Make sure the safe is selected
  if (!hasSafes.value) return false;
  if (!selectedSafe.value) return false;

  return true;
});

function openSafesPage(): void {
  router.push('/safes');
}

function handleSafeChange(event: Event): void {
  const safeAddress = (event.target as HTMLSelectElement).value as Address;
  selectSafe(safeAddress);
}

function handleSourceChainChange(event: Event): void {
  const targetChain = (event.target as HTMLSelectElement).value;
  setChainId(parseInt(targetChain) as Chain);
}

function setStorageInitcode(): void {
  initcode.value = getSimpleStorageInitcode();
}

function setOwnerInitcode(): void {
  initcode.value = getOwnerInitcode();
}

function setBallotInitcode(): void {
  initcode.value = getBallotInitcode();
}

function generateSalt(): void {
  salt.value = generatePseudoRandomString();
}

function generatePseudoRandomString(length: number = 32): Hex {
  let randomString: Hex = '0x';
  for (let i = 0; i < length; i++) {
    const randomValue = Math.floor(Math.random() * 256); // Generates a number between 0-255
    randomString += randomValue.toString(16).padStart(2, '0'); // Converts to hex and pads with 0 if necessary
  }
  return randomString;
}

function getChainName(chain: Chain): string {
  switch (chain) {
    case CHAIN_SEPOLIA:
      return 'Sepolia';
    case CHAIN_POLYGON_MUMBAI:
      return 'Polygon Mumbai';
    case CHAIN_SCROLL_SEPOLIA:
      return 'Scroll Sepolia';
    case CHAIN_ALFAJORES:
      return 'Celo Alfajores';
    case CHAIN_FUJI:
      return 'Avalanche Fuji';
    case CHAIN_BSC_TESTNET:
      return 'BSC Testnet';
    case CHAIN_MOONBASE_ALPHA:
      return 'Moonbase Alpha';
  }
}

const isDeploying = ref(false);
async function deploy(): Promise<void> {
  isDeploying.value = true;
  await deployWithSafe(
    source.value,
    target.value,
    initcode.value,
    salt.value,
    pimlicoApiKey,
    account.value,
  );
  isDeploying.value = false;
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60px;
}

h1 {
  font-size: 20px;
  font-weight: normal;
}

.buttons {
  display: flex;
  gap: 4px;
}

.content {
  display: flex;
  flex-direction: column;
  min-width: 600px;
  max-width: 100%;
  gap: 32px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.block {
  width: 100%;
}

.block-initcode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-salt {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-safes {
  display: flex;
  gap: 8px;
}

select {
  padding: 2px 4px;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: var(--color-background);
  color: var(--color-text-primary);
}
</style>
