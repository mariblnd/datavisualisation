let nitrateValues = [];
let meanNumericValue;
let nitrateAverages = [];
let exploitationChart;


const loadingPhrases = [
    "Une part significative, soit 66%, de la contamination des sources d'eau potable par les nitrates peut être attribuée aux pratiques de l'agriculture intensive, mettant en lumière l'impact de cette activité sur la qualité de notre approvisionnement en eau essentiel.",
    "Du fait de leur solubilité élevée dans l'eau, les nitrates sont aujourd'hui reconnus comme la principale source de pollution des grandes nappes phréatiques à l'échelle mondiale, soulignant la nécessité cruciale de mettre en œuvre des mesures de préservation de ces ressources vitales.",
    "Bien que les nitrates en eux-mêmes ne présentent pas de danger direct pour la santé, leur conversion en nitrites sous l'influence de bactéries présentes dans le corps humain peut avoir des conséquences indésirables. Cette transformation entraîne l'oxydation de l'hémoglobine, compromettant ainsi la capacité du sang à fixer l'oxygène et perturbant le processus essentiel de respiration cellulaire.",
    "La présence accrue de nitrates peut être particulièrement préoccupante chez les nourrissons, car elle est susceptible de déclencher la maladie bleue, une condition potentiellement grave affectant la capacité des tout-petits à transporter efficacement l'oxygène dans leur organisme."
];


async function getWaterQualityData() {
    const loader = document.getElementById('loader');
    const loadingText = document.getElementById('loadingText');

    loader.classList.remove('hidden');
    loader.style.display = 'flex';

    try {
        if (loadingText) {
            const randomIndex = Math.floor(Math.random() * loadingPhrases.length);
            loadingText.textContent = loadingPhrases[randomIndex];
        }

        const response = await fetch('https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_parametre=1340');
        const data = await response.json();
        handleWaterQualityData(data);
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);

        if (loadingText) {
            loadingText.textContent = 'Erreur lors du chargement des données';
        }
    } finally {
        loader.classList.add('hidden');
    }
}

function calculateMean(values) {
    const sum = values.reduce((acc, value) => acc + value, 0);
    return sum / values.length;
}

function calculateStandardDeviation(values) {
    const mean = calculateMean(values);

    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const meanSquaredDifferences = calculateMean(squaredDifferences);

    const standardDeviation = Math.sqrt(meanSquaredDifferences);

    return standardDeviation;
}

function calculateCovariance(x, y) {
    if (x.length !== y.length || x.length === 0) {
        throw new Error('Les tableaux x et y doivent avoir la même longueur et ne peuvent pas être vides.');
    }

    const n = x.length;
    const meanX = x.reduce((acc, value) => acc + value, 0) / n;
    const meanY = y.reduce((acc, value) => acc + value, 0) / n;

    let covariance = 0;

    for (let i = 0; i < n; i++) {
        covariance += (x[i] - meanX) * (y[i] - meanY);
    }

    return covariance / n;
}

function calculateCorrelation(x, y) {
    const covariance = calculateCovariance(x, y);
    const standardDeviationX = calculateStandardDeviation(x);
    const standardDeviationY = calculateStandardDeviation(y);

    const correlation = covariance / (standardDeviationX * standardDeviationY);
    return correlation;
}


function handleWaterQualityData(response) {
    if (response.data && Array.isArray(response.data)) {
        const data = response.data;
        const departmentsMap = new Map();

        data.slice(0, 94).forEach(entry => {
            const department = entry.nom_departement;
            const exploitationData = [8, 1992, 2364, 4714, 16, 3738, 3748, 9784, 2623, 4860, 4044, 6103, 1850, 4885, 8038, 665, 6319, 5801, 4472, 5807, 3619, 7316, 3696, 5267, 13231, 4312, 4880, 4885, 5673, 807, 3227, 7891];

            const numericValue = parseFloat(entry.resultat_numerique);

            if (department && !isNaN(numericValue)) {
                nitrateValues.push(numericValue);

                if (!departmentsMap.has(department)) {
                    departmentsMap.set(department, { sum: numericValue, count: 1 });
                } else {
                    const currentData = departmentsMap.get(department);
                    currentData.sum += numericValue;
                    currentData.count += 1;
                    departmentsMap.set(department, currentData);
                }
            }
        });

        const meanLi = document.querySelector('.moyenne');
        const ecartLi = document.querySelector('.ecart');

        meanNumericValue = calculateMean(nitrateValues);
        const standardDeviation = calculateStandardDeviation(nitrateValues);

        if (meanLi) {
            meanLi.textContent = ` ${meanNumericValue.toFixed(2)} mg/L`;
        }

        if (ecartLi) {
            ecartLi.textContent = ` ${standardDeviation.toFixed(2)}`;
        }



        const departments = [...departmentsMap.keys()];
        const nitrateAverages = departments.map(department => {
            const { sum, count } = departmentsMap.get(department);
            return sum / count;
        });

        const covariance = calculateCovariance(nitrateAverages, exploitationData);
        console.log(covariance);

        const absoluteCovariance = Math.abs(covariance);

        const covarianceElement = document.querySelector('.covariance');
        covarianceElement.textContent = `${absoluteCovariance.toFixed(2)}`;



        const meanExploitations = calculateMean(exploitationData);
        console.log(meanExploitations);

        const meanExploitationsElement = document.querySelector('.moyenne-département');
        meanExploitationsElement.textContent = `${meanExploitations.toFixed(2)} exploitations`;



        const correlation = calculateCorrelation(nitrateAverages, exploitationData);
        console.log(correlation);
        
        const absoluteCorrelation = Math.abs(correlation);

        const correlationElement = document.querySelector('.correlation');
        correlationElement.textContent = `${absoluteCorrelation.toFixed(2)}`;
        

        if (Array.isArray(response.data)) {
            const conformesCount = response.data.filter(entry => entry.conclusion_conformite_prelevement === "Eau d'alimentation conforme aux exigences de qualité en vigueur pour l'ensemble des paramètres mesurés.").length;
            const nonConformesCount = response.data.length - conformesCount;

             
                createPieChart(conformesCount, nonConformesCount);
            
        } else {
            console.error('Les données ne sont pas sous forme de tableau ou sont vides.');
        }

        createBarChart(departments, nitrateAverages, exploitationData);

    } else {
        console.error('Les données ne sont pas sous forme de tableau ou sont vides.');
    }
}

function createBarChart(departments, nitrateAverages, exploitationData) {
    const sortByNitrateCheckbox = document.getElementById('sortByNitrate');
    const includeExploitationCheckbox = document.getElementById('includeExploitationData');

    const ctx = document.getElementById('waterQualityChart').getContext('2d');
    let waterQualityChart; 
    let type = 'bar';

    sortByNitrateCheckbox.addEventListener('change', () => {
        const isChecked = sortByNitrateCheckbox.checked;
        const includeExploitation = includeExploitationCheckbox.checked;
        const sortedData = sortData(isChecked, includeExploitation);
        updateChart(sortedData, includeExploitation);
    });
    
    includeExploitationCheckbox.addEventListener('change', () => {
        const isChecked = sortByNitrateCheckbox.checked;
        const includeExploitation = includeExploitationCheckbox.checked;
        const sortedData = sortData(isChecked, includeExploitation);
        updateChart(sortedData, includeExploitation);
    });
    
    

    function sortData(isChecked, includeExploitation) {
        const sortedData = departments.map((department, index) => ({
            department,
            nitrateAverage: nitrateAverages[index],
        }));
    
        if (isChecked) {
            sortedData.sort((a, b) => a.nitrateAverage - b.nitrateAverage);
        }
    
        return sortedData;
    }
    

    function updateChart(sortedData, includeExploitation) {
        const datasets = [{
            label: 'Moyenne des Taux de Nitrate',
            data: sortedData.map(entry => entry.nitrateAverage),
            backgroundColor: '#86B6F6',
            borderColor: 'white',
        }];
    
        if (includeExploitation) {
            type = 'bubble';
            const maxExploitationValue = Math.max(...exploitationData);
    
            datasets.push({
                label: "Nombre d'exploitation agricole, à l'échelle de 50",
                data: exploitationData.map(value => (value / maxExploitationValue) * 50),
                backgroundColor: '#BED754',
                borderColor: 'white',
            });
        } else {
            type = 'bar';  
            datasets.push({
                type: 'bar',  
            });
        }
    
        const sortedDepartments = sortedData.map(entry => entry.department);
    
        waterQualityChart.data.labels = sortedDepartments;
        waterQualityChart.data.datasets = datasets;
        waterQualityChart.config.type = type;
        waterQualityChart.update();
    }
    
    

  
    waterQualityChart = new Chart(ctx, {
        type: type,
        data: {
            labels: departments,
            datasets: [{
                label: 'Moyenne des Taux de Nitrate',
                data: nitrateAverages,
                backgroundColor: '#86B6F6',
                borderColor: 'white',
                borderWidth: 2,
            }],
        },
        
        options: {
            scales: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Départements',
                        font: {
                            size: 15,
                        },
                        color: 'white', 
                    },
                    ticks: {
                        color: 'white', 
                    },
                },
                y: {
                    beginAtZero: true,
                    max: 50,
                    title: {
                        display: true,
                        text: 'Taux de Nitrate en mg/L',
                        font: {
                            size: 15,
                        },
                        color: 'white', 
                    },
                    ticks: {
                        color: 'white', 
                    },
                },
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    
                    labels: {
                        font: {
                            size: 14,
                        },
                        color:'white',
                    },
                },
                title: {
                    display: true,
                    text: 'Moyenne des taux de nitrate selon le départements',
                    color:'white',
                    font: {
                        size: 20,
                    },
                },
            },
            animation: {
                duration: 4000,
                easing: 'easeInOutQuart',
            },
        },
    });
}


function createExploitationChart(departments, exploitationData) {
    const sortByExploitationCheckbox = document.getElementById('sortByExploitation');
    const ctxExploitation = document.getElementById('numberOfExploitation').getContext('2d');

    sortByExploitationCheckbox.addEventListener('change', () => {
        const isChecked = sortByExploitationCheckbox.checked;
        sortExploitationData(isChecked);
    });

    function sortExploitationData(isChecked) {
        const sortedData = [...exploitationData];
        const dataPairs = departments.map((department, index) => ({ department, value: sortedData[index] }));

        if (isChecked) {
            dataPairs.sort((a, b) => a.value - b.value);
        }

        updateExploitationChart(dataPairs);
    }

    function updateExploitationChart(dataPairs) {
        exploitationChart.data.labels = dataPairs.map(pair => pair.department);
        exploitationChart.data.datasets[0].data = dataPairs.map(pair => pair.value);
        exploitationChart.update();
    }


    const exploitationChart = new Chart(ctxExploitation, {
        type: 'bar',
        data: {
            labels: departments,
            datasets: [{
                label: "Nombre d'exploitation agricole",
                data: exploitationData,
                backgroundColor: '#739072',
                borderColor: 'white',
                borderWidth: 2,
            }],
        },
        options: {
            scales: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Départements',
                        font: {
                            size: 15,
                        },
                        color: 'white',
                    },
                    ticks: {
                        color: 'white',
                    },
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Nombre d'exploitations",
                        font: {
                            size: 15,
                        },
                        color: 'white',
                    },
                    ticks: {
                        color: 'white',
                    },
                },
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                        },
                        color: 'white',
                    },
                },
                title: {
                    display: true,
                    text: "Nombre d'exploitation agricole",
                    color: 'white',
                    font: {
                        size: 20,
                    },
                },
            },
            animation: {
                duration: 4000,
                easing: 'easeInOutQuart',
            },
        },
    });
}

const departments = ['Paris', 'Alpes-Martime', 'Seine-et-Marne', 'Orne', 'Seine-Saint-Denis', 'Indre', 'Ardèche', 'Pyrénées-Atlantique', 'Ardennes', 'Vaucluse', 'Vienne', 'Aude', 'Haute-Marne', 'Aube', 'Manche', 'Essonne', 'Dordogne', 'Lot-et-Garonne', 'Aisne', 'Charente-Maritime', 'Indre-et-Loire', "Côtes-d'Armor", "Eure", "Calvados", "Marne", "Mayotte", "Charente", "Loire-Atlantique", "Morbihan", "Yvelines", "Pyrénées-Orientales", "Hérault"];
const exploitationData = [8, 1992, 2364, 4714, 16, 3738, 3748, 9784, 2623, 4860, 4044, 6103, 1850, 4885, 8038, 665, 6319, 5801, 4472, 5807, 3619, 7316, 3696, 5267, 13231, 4312, 4880, 4885, 5673, 807, 3227, 7891];

createExploitationChart(departments, exploitationData);


function createPieChart(conformesCount, nonConformesCount) {
    const ctx = document.getElementById('camembertChart').getContext('2d');

    const camembertChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Conformes', 'Non conformes'],
            datasets: [{
                data: [conformesCount, nonConformesCount],
                backgroundColor: ['#9EC8B9','#CD8D7A'],
                borderColor: 'white',
                borderWidth: 2,
            }],
        },
        options: {
            title: {
                display: true,
                text: 'Proportion des sources conformes à la règlementation', 
                color: 'white',
                font: {
                    size: 20,
                },
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    fontColor: 'white',
                },
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
            },
        },
    });
}


getWaterQualityData();