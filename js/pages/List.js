import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },

    template: `
        <main v-if="loading">
            <Spinner />
        </main>

        <main v-else class="page-list">
            <div class="list-container">
                <table class="list" v-if="list && list.length">
                    <tr v-for="([level, err], i) in list" :key="i">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>

                        <td class="level" :class="{ active: selected == i, error: !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">
                                    {{ level?.name || \`Error (\${err}.json)\` }}
                                </span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level?.name }}</h1>

                    <LevelAuthors
                        :author="level?.author"
                        :creators="level?.creators"
                        :verifier="level?.verifier"
                    />

                    <iframe class="video" :src="video" frameborder="0"></iframe>

                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level?.percentToQualify) }}</p>
                        </li>

                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level?.id }}</p>
                        </li>

                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level?.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>

                    <h2>Records</h2>

                    <p v-if="selected + 1 <= 75">
                        <strong>{{ level?.percentToQualify }}%</strong> or better to qualify
                    </p>

                    <p v-else-if="selected + 1 <= 150">
                        <strong>100%</strong> or better to qualify
                    </p>

                    <p v-else>
                        This level does not accept new records.
                    </p>

                    <table class="records">
                        <tr v-for="record in level?.records || []" :key="record.user">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>

                            <td class="user">
                                <a :href="record.link" target="_blank">
                                    {{ record.user }}
                                </a>
                            </td>

                            <td class="mobile">
                                <img
                                    v-if="record.mobile"
                                    :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`"
                                >
                            </td>

                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <div v-else class="level">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>

            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length">
                        <p v-for="error in errors" :key="error">
                            {{ error }}
                        </p>
                    </div>

                    <div class="og">
                        <p>
                            Website layout made by
                            <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a>
                        </p>
                    </div>

                    <template v-if="editors && editors.length">
                        <h3>List Editors</h3>

                        <ol>
                            <li v-for="editor in editors" :key="editor.name">
                                <img
                                    :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`"
                                >
                                <span>{{ editor.name }}</span>
                            </li>
                        </ol>
                    </template>

                    <h3>Submission Requirements</h3>
                    <p>No hacks allowed (FPS bypass allowed)</p>
                    <p>Must be on listed level</p>
                    <p>Must include audio/clicks</p>
                    <p>Must show full attempt/death unless first try</p>
                    <p>Must show endwall hit</p>
                    <p>No secret routes</p>
                    <p>No easy mode runs</p>
                    <p>Legacy levels only accept records for 24h</p>
                </div>
            </div>
        </main>
    `,

    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store
    }),

    computed: {
        // ✅ FIXED CRASH SAFE LEVEL
        level() {
            const item = this.list?.[this.selected];
            if (!Array.isArray(item) || !item[0]) return null;
            return item[0];
        },

        // ✅ FIXED VIDEO SAFETY
        video() {
            if (!this.level) return "";

            return embed(
                this.level.showcase
                    ? (this.toggledShowcase ? this.level.showcase : this.level.verification)
                    : this.level.verification
            );
        },
    },

    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();

        if (!this.list) {
            this.errors = ["Failed to load list."];
        }

        this.selected = 0;
        this.loading = false;
    },

    methods: {
        embed,
        score,
    },
};
