import logger from '../utils/logger.js';

class NicknameService {
    constructor() {
        this.chapters = {
            ULTRAMARINE: 'ULTRAMARINE',
            BLOOD_ANGELS: 'BLOOD_ANGELS',
            DARK_ANGELS: 'DARK_ANGELS',
            SPACE_WOLVES: 'SPACE_WOLVES',
            WHITE_SCARS: 'WHITE_SCARS',
            IMPERIAL_FISTS: 'IMPERIAL_FISTS',
            IRON_HANDS: 'IRON_HANDS'
        };

        this.nameParts = {
            // ULTRAMARINES (Roman/Latin)
            ULTRAMARINE: {
                firstPrefixes: ['Mar', 'Tit', 'Cal', 'Val', 'Luc', 'Dec', 'Max', 'Vin', 'Cor', 'Vit', 'Hon', 'Quin', 'Ant', 'Jul', 'Aug', 'Sev'],
                firstSuffixes: ['us', 'ius', 'an', 'or', 'ax', 'ex', 'ix', 'on', 'en', 'is', 'es', 'o', 'as', 'os', 'ar', 'er', 'ir', 'ur'],
                lastPrefixes: ['Cal', 'Sic', 'Vent', 'Agri', 'Num', 'Oct', 'Pom', 'Ser', 'Tib', 'Vit', 'Ae', 'Mar', 'Tit', 'Luc', 'Dec', 'Max'],
                lastSuffixes: ['gar', 'ius', 'an', 'or', 'ax', 'ex', 'ix', 'on', 'en', 'is', 'es', 'o', 'as', 'os', 'ar', 'er']
            },
            
            // BLOOD ANGELS (Italian/Latin with angelic themes)
            BLOOD_ANGELS: {
                firstPrefixes: ['Gabr', 'Raph', 'Micha', 'Ur', 'Dant', 'Mephist', 'Corbul', 'Tych', 'Alatr', 'Castig', 'Leonat', 'Hora', 'Mari', 'Cass', 'Raldor', 'Azkal'],
                firstSuffixes: ['ael', 'iel', 'io', 'us', 'on', 'or', 'an', 'os', 'es', 'in', 'is', 'or', 'an'],
                lastPrefixes: ['Sang', 'Haem', 'Cru', 'Angel', 'Seraph', 'Cherub', 'Sanct', 'Sanct', 'Sanct', 'Sanguin', 'Sanguin', 'Sanguin', 'Sanguin', 'Sanguin'],
                lastSuffixes: ['inius', 'ael', 'iel', 'ion', 'or', 'us', 'ios', 'ius', 'ael', 'iel', 'ion']
            },
            
            // DARK ANGELS (Biblical/angelic with dark themes)
            DARK_ANGELS: {
                firstPrefixes: ['Azra', 'Zaha', 'Sama', 'Bel', 'Ezechi', 'Uri', 'Raph', 'Gabri', 'Micha', 'Sari', 'Jere', 'Ezeki', 'Isra', 'Eli', 'Jona', 'Dani'],
                firstSuffixes: ['el', 'ael', 'iel', 'iah', 'iel', 'on', 'us', 'in', 'as', 'am', 'or', 'an'],
                lastPrefixes: ['Dark', 'Raven', 'Death', 'Dusk', 'Night', 'Shadow', 'Obsid', 'Ebony', 'Onyx', 'Raven', 'Asmod', 'Azmo', 'Bel', 'Sama', 'Zaha'],
                lastSuffixes: ['wing', 'blade', 'fury', 'wrath', 'bane', 'mourn', 'shroud', 'veil', 'gloom', 'fang', 'claw']
            },
            
            // SPACE WOLVES (Norse/Germanic)
            SPACE_WOLVES: {
                firstPrefixes: ['Ragn', 'Bjorn', 'Erik', 'Ulf', 'Thor', 'Lok', 'Bald', 'Fenr', 'Hrod', 'Sven', 'Gun', 'Sig', 'Har', 'Iva', 'Magn', 'Olaf', 'Rus', 'Sten', 'Tor', 'Vig', 'Logan', 'Arjac', 'Njal', 'Ulrik', 'Lukas'],
                firstSuffixes: ['ar', 'ir', 'or', 'ur', 'er', 'i', 'e', 'o', 'a', 'us', 'is', 'an', 'en', 'in', 'e', 'a', 'o'],
                // Added more compound last names and special suffixes for Space Wolves
                lastPrefixes: ['Black', 'Grim', 'Iron', 'Storm', 'Thunder', 'Frost', 'Blood', 'Moon', 'Raven', 'Bear', 'Hunt', 'Gore', 'Mourn', 'Doom', 'Death', 'Red', 'White', 'Grey', 'Long', 'Swift', 'Battle', 'War', 'Fell', 'Stone', 'Rock', 'Fire', 'Ice'],
                lastSuffixes: ['fang', 'claw', 'maw', 'mane', 'howl', 'pelt', 'born', 'wulf', 'bjorn', 'son', 'blade', 'fist', 'helm', 'tooth', 'hair', 'eye', 'hand', 'foot', 'heart', 'kin', 'blood', 'rage', 'howl', 'roar', 'fury'],
                // Special compound last names for Space Wolves
                compoundLastNames: [
                    'Blackmane', 'Fell-Handed', 'Stormcaller', 'Rockfist', 'Thunderfist', 
                    'Ironfist', 'Stormwolf', 'Frostblade', 'Bloodhowl', 'Grimblood',
                    'Swiftclaw', 'Longfang', 'Stormpelt', 'Wolftooth', 'Ragnarok',
                    'Frostblade', 'Stormrider', 'Bloodmoon', 'Huntmaster', 'Wolfsbane'
                ]
            },
            
            // WHITE SCARS (Mongolian/Asian)
            WHITE_SCARS: {
                firstPrefixes: ['Jagh', 'Kor', 'Tul', 'Tsu', 'Shi', 'Khan', 'Tem', 'Subu', 'Batu', 'Kubl', 'Gengh', 'Khad', 'Togr', 'Yesu', 'Chag', 'Berke', 'Mong', 'Oged', 'Boro'],
                firstSuffixes: ['atai', 'ghai', 'lun', 'dei', 'lji', 'tei', 'riq', 'dai', 'dei', 'tei', 'lun', 'jin', 'qan', 'tei'],
                lastPrefixes: ['White', 'Storm', 'Wind', 'Sky', 'Horse', 'Arrow', 'Bow', 'Steppe', 'Mountain', 'Eagle', 'Falcon', 'Tiger', 'Dragon', 'Blade', 'Spear', 'Khan'],
                lastSuffixes: ['rider', 'strider', 'hunter', 'runner', 'seeker', 'striker', 'blade', 'fist', 'khan', 'tai', 'jin', 'tei']
            },
            
            // IMPERIAL FISTS (Germanic/Latin)
            IMPERIAL_FISTS: {
                firstPrefixes: ['Rog', 'Lys', 'Sig', 'Hein', 'Diet', 'Lud', 'Kurt', 'Hans', 'Wolf', 'Gun', 'Ulr', 'Frie', 'Eber', 'Gott', 'Rup', 'Klas', 'Ber', 'Theo', 'Loth', 'Ger'],
                firstSuffixes: ['er', 'ar', 'us', 'an', 'o', 'i', 'e', 'a', 'in', 'ir', 'or', 'en', 'on'],
                lastPrefixes: ['Fist', 'Shield', 'Wall', 'Fort', 'Bastion', 'Rampart', 'Bulwark', 'Citadel', 'Tower', 'Keep', 'Castle', 'Strong', 'Stone', 'Iron', 'Steel', 'Adamant'],
                lastSuffixes: ['fist', 'wall', 'guard', 'warden', 'keeper', 'defender', 'protector', 'bastion', 'fortress', 'stronghold']
            },
            
            // IRON HANDS (Mechanical/Industrial)
            IRON_HANDS: {
                firstPrefixes: ['Ferr', 'Iron', 'Steel', 'Adam', 'Titan', 'Vulc', 'Tech', 'Mech', 'Cog', 'Serv', 'Auto', 'Cyber', 'Necr', 'Omni', 'Stron', 'Dura', 'Forge', 'Anvil', 'Hammer', 'Piston'],
                firstSuffixes: ['us', 'an', 'or', 'ax', 'ex', 'ix', 'on', 'en', 'is', 'es', 'o', 'ar', 'er', 'ir', 'ur'],
                lastPrefixes: ['Iron', 'Steel', 'Adamant', 'Titan', 'Vulcan', 'Tech', 'Mech', 'Cog', 'Servo', 'Auto', 'Cyber', 'Necro', 'Omni', 'Strong', 'Dura', 'Forge'],
                lastSuffixes: ['fist', 'hand', 'arm', 'grip', 'claw', 'maw', 'fist', 'grip', 'hold', 'clamp', 'vice']
            }
        };

        // Famous names for each chapter
        this.famousNames = {
            ULTRAMARINE: ['Marneus Calgar', 'Uriel Ventris', 'Cato Sicarius', 'Titus Valerius', 'Leandros', 'Varro Tigurius'],
            BLOOD_ANGELS: ['Dante', 'Mephiston', 'Corbulo', 'Astorath the Grim', 'Gabriel Seth', 'Tycho the Lost'],
            DARK_ANGELS: ['Azrael', 'Ezekiel', 'Belial', 'Sammael', 'Asmodai', 'Zahariel'],
            SPACE_WOLVES: ['Ragnar Blackmane', 'Bjorn the Fell-Handed', 'Logan Grimnar', 'Ulrik the Slayer', 'Arjac Rockfist', 'Njal Stormcaller'],
            WHITE_SCARS: ['Kor\'sarro Khan', 'Jubal Khan', 'Tsu-gan', 'Qin Xa', 'Yao Ming', 'Temur Khan'],
            IMPERIAL_FISTS: ['Rogal Dorn', 'Lysander', 'Vorn Hagan', 'Vorn Hagan', 'Maximus Thane', 'Tor Garadon'],
            IRON_HANDS: ['Kardan Stronos', 'Gabriel Santar', 'Autek Mor', 'Kristos', 'Clan Raukaan', 'Feirros']
        };
    }

    /**
     * Generates a random name based on chapter type
     * @param {string} type - Chapter type (e.g., 'ULTRAMARINE', 'BLOOD_ANGELS')
     * @returns {string} Generated name
     */
    generateNickname(type = 'UNSPECIFIED') {
        try {
            // If type is UNSPECIFIED, pick a random chapter
            if (type === 'UNSPECIFIED') {
                const chapterKeys = Object.keys(this.chapters);
                type = chapterKeys[Math.floor(Math.random() * chapterKeys.length)];
            }

            // Convert to uppercase to match our keys
            type = type.toUpperCase();

            // If type is invalid, default to ULTRAMARINE
            if (!this.chapters[type]) {
                logger.warn(`Invalid chapter type: ${type}, defaulting to ULTRAMARINE`);
                type = 'ULTRAMARINE';
            }

            // // 30% chance to return a famous name
            // if (Math.random() < 0.3 && this.famousNames[type]?.length) {
            //     return this.getRandomElement(this.famousNames[type]);
            // }

            // Otherwise generate a new name
            return this.generateChapterName(type);
        } catch (error) {
            logger.error('Error generating nickname:', error);
            return 'Battle-Brother';
        }
    }

    /**
     * Generates a name for a specific chapter
     * @param {string} chapter - Chapter type
     * @returns {string} Generated name
     */
    generateChapterName(chapter) {
        const parts = this.nameParts[chapter] || this.nameParts.ULTRAMARINE;
        
        const getPart = (prefixes, suffixes) => {
            const prefix = this.getRandomElement(prefixes);
            const suffix = this.getRandomElement(suffixes);
            return this.capitalize(prefix + suffix);
        };

        const firstName = getPart(parts.firstPrefixes, parts.firstSuffixes);
        
        // Special handling for Space Wolves compound last names
        let lastName;
        if (chapter === 'SPACE_WOLVES' && parts.compoundLastNames && Math.random() < 0.4) {
            // 40% chance to use a compound last name for Space Wolves
            lastName = this.getRandomElement(parts.compoundLastNames);
        } else {
            // Standard name generation
            lastName = getPart(parts.lastPrefixes, parts.lastSuffixes);
        }

        return `${firstName} ${lastName}`;
    }

    // Helper methods
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
}

// Create a singleton instance
export const nicknameService = new NicknameService();
export default nicknameService;