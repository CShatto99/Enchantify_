import { SlashCommandBuilder } from 'discord.js';
import * as fs from 'fs';
import { BaseInteraction, Enchantments } from '../@types/custom';
import {
  COMMANDS,
  INPUT_OPTIONS,
  MAX_AUTOCOMPLETE_OPTIONS,
} from '../constants';
import { ENCHANTMENTS_FILE_PATH } from '../constants/index';
import getErrorMessage from '../utils/getErrorMessage';
import simpleSearch from '../utils/simpleSearch';

const remove = {
  data: new SlashCommandBuilder()
    .setName(COMMANDS.remove)
    .setDescription('Remove an enchantment')
    .addStringOption(option =>
      option
        .setName(INPUT_OPTIONS.enchantment)
        .setDescription('Enter an enchantment name')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async execute(interaction: BaseInteraction) {
    try {
      fs.readFile(ENCHANTMENTS_FILE_PATH, 'utf8', async (error, data) => {
        if (error) {
          console.error(
            `Error opening file located at ${ENCHANTMENTS_FILE_PATH}: `,
            error
          );
          await interaction.reply({
            content: `❌ Error fetching enchantments data`,
            ephemeral: true,
          });
        } else {
          const enchantment: string = interaction.options.getString(
            INPUT_OPTIONS.enchantment
          );
          const enchantments: Enchantments = JSON.parse(data);
          const { level = undefined } = enchantments[enchantment] || {};

          if (!level) {
            const similarSearch = simpleSearch(
              enchantment,
              Object.keys(enchantments)
            );
            await interaction.reply({
              content:
                similarSearch.length > 0
                  ? `❌ Enchantment not found, did you mean ${similarSearch[0]}?`
                  : `❌ Enchantment not found`,
              ephemeral: true,
            });
            return;
          }

          delete enchantments[enchantment];

          fs.writeFile(
            ENCHANTMENTS_FILE_PATH,
            JSON.stringify(enchantments, null, 2),
            async error => {
              if (error) {
                console.error(
                  `Error writing to file located at ${ENCHANTMENTS_FILE_PATH}: `,
                  error
                );
                await interaction.reply({
                  content: `❌ Error updating enchantments data`,
                  ephemeral: true,
                });
              } else {
                console.log('Data has been written to', ENCHANTMENTS_FILE_PATH);
                await interaction.reply({
                  content: `${enchantment} ${level} removed.`,
                });
              }
            }
          );
        }
      });
    } catch (error) {
      console.error(`${COMMANDS.remove} error: `, error);
      await interaction.reply({
        content: `❌ ${getErrorMessage(error)}`,
        ephemeral: true,
      });
    }
  },
  async autocomplete(interaction: BaseInteraction) {
    try {
      fs.readFile(ENCHANTMENTS_FILE_PATH, 'utf8', async (error, data) => {
        if (error) {
          console.error(
            `Error opening file located at ${ENCHANTMENTS_FILE_PATH}: `,
            error
          );
          await interaction.reply({
            content: `❌ Error fetching enchantments data`,
            ephemeral: true,
          });
        } else {
          // Extract the search term from the interaction's options
          const search = interaction.options.getFocused();

          const enchantments: Enchantments = JSON.parse(data);

          // Create a list of choices with name and value properties
          const options = Object.keys(enchantments).map(enchantment => ({
            name: enchantment,
            value: enchantment,
          }));

          // Filter the choices based on the search term
          const filteredOptions = options
            .slice(0, MAX_AUTOCOMPLETE_OPTIONS)
            .filter(option => option.value.startsWith(search));

          await interaction.respond(filteredOptions);
        }
      });
    } catch (error) {
      console.error(
        `Error occurred during search autocomplete: ${error.message}`
      );

      // Send an error response to the interaction
      await interaction.respond({
        content: `❌ ${getErrorMessage(error)}`,
        ephemeral: true,
      });
    }
  },
};

export default remove;